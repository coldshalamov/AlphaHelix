// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

import {ITruthMarket} from "./interfaces/ITruthMarket.sol";
import {IAlphaHelixRegistry} from "./interfaces/IAlphaHelixRegistry.sol";

/**
 * @title TruthMarket
 * @notice Parimutuel-style market for a single Helix claim. Stakes accumulate in True/False/Unaligned
 *         pools, and the side with the greater bonded capital after the trading window is considered
 *         the consensus truth. Unaligned liquidity is routed to the winning side to encourage closure.
 */
contract TruthMarket is Initializable, ReentrancyGuard, ITruthMarket {
    using SafeERC20 for IERC20;

    enum MarketState {
        Trading,
        Resolved
    }

    struct SeedConfig {
        address seeder;
        uint256 trueStake;
        uint256 falseStake;
        uint256 unalignedStake;
        bool lockSeeder;
    }

    IERC20 public hlx;
    IAlphaHelixRegistry public registry;
    address public treasury;

    uint256 public override claimId;
    uint256 public override version;

    uint64 public override tradingClosesAt;
    uint64 public resolutionDelaySeconds;
    uint64 public appealWindowSeconds;
    uint64 public override resolvedAt;

    uint16 public feeBps;
    uint256 public minStake;

    MarketState public state;
    Resolution public override winningOutcome;
    uint256 public override confidenceBps;

    uint256 public winnerPayoutPool;
    uint256 public winnerStake;
    uint256 public protocolFee;

    Totals private _totals;

    struct UserPosition {
        uint256 trueStake;
        uint256 falseStake;
        uint256 unalignedStake;
        bool paid;
        bool locked;
    }

    mapping(address => UserPosition) private _positions;

    event StakePlaced(
        address indexed bettor,
        Side indexed side,
        uint256 amount
    );

    event StakeWithdrawn(
        address indexed bettor,
        Side indexed side,
        uint256 amount
    );

    event MarketResolved(
        Resolution outcome,
        uint256 confidenceBps,
        uint256 trueStake,
        uint256 falseStake,
        uint256 unalignedStake,
        uint256 protocolFee
    );

    event PayoutClaimed(address indexed bettor, uint256 payout);

    error MarketClosed();
    error MarketNotResolved();
    error MinimumStakeNotMet();
    error WithdrawalNotAllowed();
    error AlreadyPaid();

    function initialize(
        address registry_,
        address hlxToken_,
        address treasury_,
        uint256 claimId_,
        uint256 version_,
        uint64 tradingClosesAt_,
        uint64 resolutionDelaySeconds_,
        uint64 appealWindowSeconds_,
        uint256 minStake_,
        uint16 feeBps_,
        SeedConfig calldata seed
    ) external initializer {
        require(registry_ != address(0), "Registry required");
        require(hlxToken_ != address(0), "Token required");
        require(treasury_ != address(0), "Treasury required");
        require(tradingClosesAt_ > block.timestamp, "Close in past");

        registry = IAlphaHelixRegistry(registry_);
        hlx = IERC20(hlxToken_);
        treasury = treasury_;
        claimId = claimId_;
        version = version_;
        tradingClosesAt = tradingClosesAt_;
        resolutionDelaySeconds = resolutionDelaySeconds_;
        appealWindowSeconds = appealWindowSeconds_;
        minStake = minStake_;
        feeBps = feeBps_;

        state = MarketState.Trading;
        winningOutcome = Resolution.Pending;

        uint256 seedSum = seed.trueStake +
            seed.falseStake +
            seed.unalignedStake;

        if (seedSum > 0) {
            require(seed.seeder != address(0), "Seeder missing");
            require(
                hlx.balanceOf(address(this)) >= seedSum,
                "Seed balance missing"
            );
            UserPosition storage position_ = _positions[seed.seeder];
            if (seed.trueStake > 0) {
                position_.trueStake += seed.trueStake;
                _totals.trueStake += seed.trueStake;
            }
            if (seed.falseStake > 0) {
                position_.falseStake += seed.falseStake;
                _totals.falseStake += seed.falseStake;
            }
            if (seed.unalignedStake > 0) {
                position_.unalignedStake += seed.unalignedStake;
                _totals.unalignedStake += seed.unalignedStake;
            }
            if (seed.lockSeeder) {
                position_.locked = true;
            }
        }
    }

    // --- Core flows ---

    function placeBet(Side side, uint256 amount) external nonReentrant {
        if (block.timestamp >= tradingClosesAt) revert MarketClosed();
        if (amount < minStake) revert MinimumStakeNotMet();
        require(amount > 0, "Zero amount");

        hlx.safeTransferFrom(msg.sender, address(this), amount);

        UserPosition storage position_ = _positions[msg.sender];
        if (side == Side.True) {
            position_.trueStake += amount;
            _totals.trueStake += amount;
        } else if (side == Side.False) {
            position_.falseStake += amount;
            _totals.falseStake += amount;
        } else {
            position_.unalignedStake += amount;
            _totals.unalignedStake += amount;
        }

        emit StakePlaced(msg.sender, side, amount);
    }

    function withdraw(Side side, uint256 amount) external nonReentrant {
        if (block.timestamp >= tradingClosesAt) revert MarketClosed();
        require(amount > 0, "Zero amount");

        UserPosition storage position_ = _positions[msg.sender];
        if (position_.locked) revert WithdrawalNotAllowed();
        if (side == Side.True) {
            require(position_.trueStake >= amount, "Insufficient stake");
            position_.trueStake -= amount;
            _totals.trueStake -= amount;
        } else if (side == Side.False) {
            require(position_.falseStake >= amount, "Insufficient stake");
            position_.falseStake -= amount;
            _totals.falseStake -= amount;
        } else {
            require(position_.unalignedStake >= amount, "Insufficient stake");
            position_.unalignedStake -= amount;
            _totals.unalignedStake -= amount;
        }

        hlx.safeTransfer(msg.sender, amount);
        emit StakeWithdrawn(msg.sender, side, amount);
    }

    function resolve() external nonReentrant {
        if (state != MarketState.Trading) revert MarketClosed();
        require(
            block.timestamp >= tradingClosesAt + resolutionDelaySeconds,
            "Resolution delay"
        );

        Totals memory totals_ = _totals;
        uint256 totalValue = totals_.trueStake +
            totals_.falseStake +
            totals_.unalignedStake;

        Resolution outcome;
        uint256 localWinnerStake;
        uint256 localLoserStake;

        if (
            totals_.trueStake == 0 &&
            totals_.falseStake == 0
        ) {
            outcome = Resolution.Unresolved;
        } else if (totals_.trueStake == totals_.falseStake) {
            outcome = Resolution.Unresolved;
        } else if (totals_.trueStake > totals_.falseStake) {
            outcome = Resolution.True;
            localWinnerStake = totals_.trueStake;
            localLoserStake = totals_.falseStake;
        } else {
            outcome = Resolution.False;
            localWinnerStake = totals_.falseStake;
            localLoserStake = totals_.trueStake;
        }

        winningOutcome = outcome;
        state = MarketState.Resolved;
        resolvedAt = uint64(block.timestamp);

        uint256 localPayoutPool;
        uint256 localProtocolFee;

        if (outcome == Resolution.True || outcome == Resolution.False) {
            uint256 feeBase = localLoserStake + totals_.unalignedStake;
            if (feeBase > 0 && feeBps > 0) {
                localProtocolFee = (feeBase * feeBps) / 10_000;
                if (localProtocolFee > 0) {
                    hlx.safeTransfer(treasury, localProtocolFee);
                }
            }
            localPayoutPool = feeBase - localProtocolFee;
            winnerStake = localWinnerStake;
            winnerPayoutPool = localPayoutPool;
            protocolFee = localProtocolFee;
        }

        confidenceBps = _computeConfidence(totals_);

        emit MarketResolved(
            outcome,
            confidenceBps,
            totals_.trueStake,
            totals_.falseStake,
            totals_.unalignedStake,
            localProtocolFee
        );

        IAlphaHelixRegistry.ResolutionReport memory report = IAlphaHelixRegistry
            .ResolutionReport({
                claimId: claimId,
                version: version,
                outcome: outcome,
                confidenceBps: confidenceBps,
                totalValueLocked: totalValue,
                trueStake: totals_.trueStake,
                falseStake: totals_.falseStake,
                unalignedStake: totals_.unalignedStake,
                protocolFee: localProtocolFee
            });

        registry.onMarketResolved(report);
    }

    function claimPayout() external nonReentrant {
        if (state != MarketState.Resolved) revert MarketNotResolved();

        UserPosition storage position_ = _positions[msg.sender];
        if (position_.paid) revert AlreadyPaid();

        uint256 payout;

        if (winningOutcome == Resolution.True) {
            uint256 stake = position_.trueStake;
            if (stake > 0) {
                payout = stake;
                if (winnerPayoutPool > 0) {
                    payout +=
                        (stake * winnerPayoutPool) /
                        winnerStake;
                }
            }
        } else if (winningOutcome == Resolution.False) {
            uint256 stake = position_.falseStake;
            if (stake > 0) {
                payout = stake;
                if (winnerPayoutPool > 0) {
                    payout +=
                        (stake * winnerPayoutPool) /
                        winnerStake;
                }
            }
        } else {
            payout =
                position_.trueStake +
                position_.falseStake +
                position_.unalignedStake;
        }

        position_.paid = true;
        position_.trueStake = 0;
        position_.falseStake = 0;
        position_.unalignedStake = 0;

        if (payout > 0) {
            hlx.safeTransfer(msg.sender, payout);
        }

        emit PayoutClaimed(msg.sender, payout);
    }

    // --- Views ---

    function totals()
        external
        view
        override
        returns (Totals memory aggregate, uint256 totalStake)
    {
        aggregate = _totals;
        totalStake =
            aggregate.trueStake +
            aggregate.falseStake +
            aggregate.unalignedStake;
    }

    function position(
        address account
    ) external view override returns (Position memory) {
        UserPosition memory stored = _positions[account];
        return
            Position({
                trueStake: stored.trueStake,
                falseStake: stored.falseStake,
                unalignedStake: stored.unalignedStake,
                paidOut: stored.paid,
                locked: stored.locked
            });
    }

    function getMarketState() external view returns (MarketState) {
        return state;
    }

    function _computeConfidence(
        Totals memory totals_
    ) private pure returns (uint256) {
        uint256 t = totals_.trueStake;
        uint256 f = totals_.falseStake;
        uint256 u = totals_.unalignedStake;
        uint256 total = t + f + u;
        if (total == 0) return 0;
        if (t == f) return 0;
        uint256 diff = t > f ? t - f : f - t;
        return Math.mulDiv(diff, 10_000, total);
    }
}
