// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AlphaHelixToken.sol";

/// @title HelixMarket
/// @notice Commit-reveal prediction markets with HLX staking and no admin controls.
contract HelixMarket is ReentrancyGuard {
    AlphaHelixToken public immutable token;
    uint256 public constant STATEMENT_FEE = 100 * 10**18; // 100 HLX
    uint256 public constant ORIGINATOR_FEE_BPS = 100; // 1%
    uint256 public constant UNREVEALED_PENALTY_BPS = 100; // 1% burned on unrevealed withdrawals
    uint256 public marketCount;
    // Use a dead address for burning since we can't transfer to address(0)
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    struct Statement {
        string ipfsCid;
        uint256 commitEndTime;
        uint256 revealEndTime;
        uint256 yesPool;
        uint256 noPool;
        uint256 unalignedPool;
        bool resolved;
        bool outcome; // true = YES, false = NO (only valid if resolved and not tie)
        address originator;
    }

    struct Bet {
        uint256 amount;
        uint256 timestamp;
        bool revealed;
    }

    mapping(uint256 => Statement) public markets;
    // marketId => user => commitHash
    mapping(uint256 => mapping(address => bytes32)) public commits;
    // marketId => user => hasCommitted
    mapping(uint256 => mapping(address => bool)) public hasCommitted;

    // Tracking payouts requires knowing how much a user bet on the winning side.
    // marketId => user => side => amount
    // side: 0 = NO, 1 = YES, 2 = UNALIGNED
    mapping(uint256 => mapping(address => mapping(uint8 => uint256))) public bets;

    // Store committed amount to move to pools upon reveal
    mapping(uint256 => mapping(address => uint256)) public committedAmount;

    event StatementCreated(uint256 indexed marketId, string ipfsCid, uint256 commitEndTime, uint256 revealEndTime, address originator);
    event BetCommitted(uint256 indexed marketId, address indexed user, bytes32 commitHash, uint256 amount);
    event BetRevealed(uint256 indexed marketId, address indexed user, uint8 choice, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool outcome, bool tie, uint256 totalPool, uint256 originatorFee);
    event UnrevealedWithdrawn(uint256 indexed marketId, address indexed user, uint256 amountReturned, uint256 penaltyBurned);

    constructor(address _token) {
        token = AlphaHelixToken(_token);
    }

    /// @notice Create a new market statement.
    /// @param ipfsCid Content identifier describing the statement.
    /// @param biddingDuration Duration of the commit phase in seconds.
    /// @param revealDuration Duration of the reveal phase in seconds.
    function submitStatement(string memory ipfsCid, uint256 biddingDuration, uint256 revealDuration) external nonReentrant {
        require(token.transferFrom(msg.sender, address(this), STATEMENT_FEE), "Fee transfer failed");
        token.transfer(BURN_ADDRESS, STATEMENT_FEE);

        uint256 marketId = marketCount++;
        Statement storage s = markets[marketId];
        s.ipfsCid = ipfsCid;
        s.commitEndTime = block.timestamp + biddingDuration;
        s.revealEndTime = s.commitEndTime + revealDuration;
        s.originator = msg.sender;

        emit StatementCreated(marketId, ipfsCid, s.commitEndTime, s.revealEndTime, msg.sender);
    }

    /// @notice Commit a hashed bet during the commit phase.
    /// @param marketId Identifier of the market.
    /// @param commitHash Hash of (choice, salt, bettor address).
    /// @param amount Amount of HLX to stake.
    function commitBet(uint256 marketId, bytes32 commitHash, uint256 amount) external nonReentrant {
        Statement storage s = markets[marketId];
        require(block.timestamp < s.commitEndTime, "Commit phase over");
        require(amount > 0, "Amount must be > 0");

        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        commits[marketId][msg.sender] = commitHash;
        hasCommitted[marketId][msg.sender] = true;

        // Accumulate committed amount.
        committedAmount[marketId][msg.sender] += amount;

        emit BetCommitted(marketId, msg.sender, commitHash, amount);
    }

    /// @notice Reveal a committed bet once the reveal window opens.
    /// @param marketId Identifier of the market.
    /// @param choice 0 = NO, 1 = YES, 2 = UNALIGNED.
    /// @param salt Salt used to create the commit hash.
    function revealBet(uint256 marketId, uint8 choice, uint256 salt) external nonReentrant {
        Statement storage s = markets[marketId];
        require(block.timestamp >= s.commitEndTime, "Commit phase not active");
        require(block.timestamp < s.revealEndTime, "Reveal phase over");

        bytes32 storedHash = commits[marketId][msg.sender];
        require(storedHash != bytes32(0), "No bet committed");

        require(keccak256(abi.encodePacked(choice, salt, msg.sender)) == storedHash, "Invalid hash/reveal");

        uint256 amount = committedAmount[marketId][msg.sender];
        require(amount > 0, "Already revealed or no amount");

        committedAmount[marketId][msg.sender] = 0;

        if (choice == 1) { // YES
            s.yesPool += amount;
            bets[marketId][msg.sender][1] += amount;
        } else if (choice == 0) { // NO
            s.noPool += amount;
            bets[marketId][msg.sender][0] += amount;
        } else { // UNALIGNED (assuming 2)
            s.unalignedPool += amount;
            bets[marketId][msg.sender][2] += amount;
        }

        emit BetRevealed(marketId, msg.sender, choice, amount);
    }

    /// @notice Resolve a market after the reveal period ends.
    /// @dev Applies tie logic (full refunds, no originator fee) when yes/no pools match.
    function resolve(uint256 marketId) external nonReentrant {
        Statement storage s = markets[marketId];
        require(block.timestamp > s.revealEndTime, "Reveal phase not over");
        require(!s.resolved, "Already resolved");

        s.resolved = true;
        uint256 totalPool = s.yesPool + s.noPool + s.unalignedPool;
        bool tie = false;
        if (s.yesPool > s.noPool) {
            s.outcome = true; // YES Wins
        } else if (s.noPool > s.yesPool) {
            s.outcome = false; // NO Wins
        } else {
            tie = true;
        }

        uint256 fee = 0;
        if (!tie) {
            fee = _calculateFee(totalPool);
            if (fee > 0) {
                token.transfer(s.originator, fee);
            }
        }

        emit MarketResolved(marketId, s.outcome, tie, totalPool, fee);
    }

    /// @notice Claim winnings (or refunds in a tie) after resolution.
    /// @param marketId Identifier of the market.
    function claim(uint256 marketId) external nonReentrant {
        Statement storage s = markets[marketId];
        require(s.resolved, "Not resolved");

        uint256 userBet = 0;
        uint256 winningPool = 0;
        uint256 totalPool = s.yesPool + s.noPool + s.unalignedPool;
        bool tie = s.yesPool == s.noPool;
        uint256 fee = tie ? 0 : _calculateFee(totalPool);
        uint256 rewardPool = totalPool - fee;

        if (tie) {
            userBet = bets[marketId][msg.sender][0] + bets[marketId][msg.sender][1] + bets[marketId][msg.sender][2];
            winningPool = totalPool;
        } else if (s.outcome) { // YES Won
            userBet = bets[marketId][msg.sender][1];
            winningPool = s.yesPool;
        } else { // NO Won
            userBet = bets[marketId][msg.sender][0];
            winningPool = s.noPool;
        }

        require(userBet > 0, "No winning bet");

        _clearUserBets(marketId, tie, s.outcome);

        uint256 payout = tie ? userBet : (userBet * rewardPool) / winningPool;
        require(token.transfer(msg.sender, payout), "Transfer failed");
    }

    /// @notice Withdraw committed HLX that was never revealed once the reveal window has closed.
    /// @dev Applies a small burn penalty to discourage forgetting to reveal.
    function withdrawUnrevealed(uint256 marketId) external nonReentrant {
        Statement storage s = markets[marketId];
        require(block.timestamp > s.revealEndTime, "Reveal phase not over");

        uint256 amount = committedAmount[marketId][msg.sender];
        require(amount > 0, "No unrevealed stake");

        committedAmount[marketId][msg.sender] = 0;
        commits[marketId][msg.sender] = bytes32(0);

        uint256 penalty = (amount * UNREVEALED_PENALTY_BPS) / 10000;
        uint256 refund = amount - penalty;

        if (penalty > 0) {
            require(token.transfer(BURN_ADDRESS, penalty), "Penalty transfer failed");
        }

        require(token.transfer(msg.sender, refund), "Refund transfer failed");
        emit UnrevealedWithdrawn(marketId, msg.sender, refund, penalty);
    }

    function _calculateFee(uint256 totalPool) internal pure returns (uint256) {
        return (totalPool * ORIGINATOR_FEE_BPS) / 10000;
    }

    function _clearUserBets(uint256 marketId, bool tie, bool outcome) internal {
        if (tie) {
            bets[marketId][msg.sender][0] = 0;
            bets[marketId][msg.sender][1] = 0;
            bets[marketId][msg.sender][2] = 0;
        } else if (outcome) {
            bets[marketId][msg.sender][1] = 0;
        } else {
            bets[marketId][msg.sender][0] = 0;
        }
    }
}