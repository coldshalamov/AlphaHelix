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
    uint256 public constant UNREVEALED_PENALTY_BPS = 10000; // 100% burned on unrevealed withdrawals
    uint256 public constant MIN_REVEAL_DURATION = 1 hours;
    uint256 public constant MIN_BIDDING_DURATION = 1 hours;
    uint256 public constant MAX_DURATION = 52 weeks;
    uint256 public constant MAX_CID_LENGTH = 128;
    // Random close configuration
    uint256 public constant MIN_COMMIT_DURATION = 1 hours;  // Minimum before random close can trigger
    uint256 public constant MAX_COMMIT_DURATION = 52 weeks; // Fallback max duration
    uint256 public constant PING_REWARD = 1 * 10**18;       // 1 HLX reward for closing a market via ping
    uint256 public marketCount;
    // Use a dead address for burning since we can't transfer to address(0)
    address constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    struct Statement {
        string ipfsCid;
        uint256 commitEndTime;      // For fixed-time: end of commit phase. For random close: earliest close time.
        uint256 revealEndTime;
        uint256 yesPool;
        uint256 noPool;
        uint256 unalignedPool;
        bool resolved;
        bool outcome; // true = YES, false = NO (only valid if resolved and not tie)
        bool tie; // true when yesPool == noPool at resolution time
        address originator;
        // Accounting to avoid permanently locking rounding dust in pro-rata payouts.
        // Winner payouts are computed pro-rata except the last winner, who receives any remainder.
        uint256 claimedWinningStake;
        uint256 claimedRewardPaid;
        // Random close fields
        bytes32 closeSeed;           // Market-specific entropy seed
        uint256 difficultyTarget;    // Hash must be < this to close
        bool randomCloseEnabled;     // True = random close, False = fixed time (backwards compat)
        uint256 commitPhaseClosed;   // Timestamp when commit phase closed (0 = still open for random close)
        uint256 revealDuration;      // Stored reveal duration for random close markets
        uint256 hardCommitEndTime;   // For random close: forced close time. For fixed-time: equals commitEndTime.
        bool pingRewardPaid;         // Ensures ping reward is paid at most once per market.
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
    event Claimed(uint256 indexed marketId, address indexed user, uint8 side, uint256 stake, uint256 payout, bool tie);
    // Random close events
    event CommitPhaseClosedRandomly(uint256 indexed marketId, bytes32 closeHash, uint256 timestamp);
    event MarketCreatedWithRandomClose(uint256 indexed marketId, uint256 difficultyTarget, uint256 avgDuration);

    constructor(address _token) {
        token = AlphaHelixToken(_token);
    }

    modifier validMarket(uint256 marketId) {
        require(marketId < marketCount, "Invalid market");
        _;
    }

    /// @notice Checks if market should randomly close based on hash difficulty
    /// @dev Runs on every market interaction (commit, reveal, ping)
    modifier checkRandomClose(uint256 marketId) {
        Statement storage s = markets[marketId];

        // Only check if:
        // 1. Random close is enabled for this market
        // 2. Commit phase not already closed
        // 3. Minimum duration has passed
        if (s.randomCloseEnabled &&
            s.commitPhaseClosed == 0 &&
            block.timestamp >= s.commitEndTime) {

            // Compute hash from multiple entropy sources
            bytes32 closeHash = keccak256(abi.encodePacked(
                blockhash(block.number - 1),    // Recent block hash
                blockhash(block.number - 2),    // 2 blocks ago
                blockhash(block.number - 3),    // 3 blocks ago
                msg.sender,                      // Current transaction sender
                tx.gasprice,                     // Gas price of this tx
                s.yesPool,                       // Current YES pool state
                s.noPool,                        // Current NO pool state
                s.unalignedPool,                 // Current UNALIGNED pool state
                s.closeSeed,                     // Market-specific seed
                block.timestamp                  // Current timestamp
            ));

            // Check if hash meets difficulty target
            if (uint256(closeHash) < s.difficultyTarget || block.timestamp >= s.hardCommitEndTime) {
                // COMMIT PHASE CLOSES NOW
                s.commitPhaseClosed = block.timestamp;

                // Reveal phase starts immediately and lasts for the stored reveal duration
                s.revealEndTime = block.timestamp + s.revealDuration;

                emit CommitPhaseClosedRandomly(marketId, closeHash, block.timestamp);

                // Pay ping reward once, funded by the statement fee for random-close markets.
                if (!s.pingRewardPaid) {
                    s.pingRewardPaid = true;
                    require(token.transfer(msg.sender, PING_REWARD), "Reward transfer failed");
                }
            }
        }

        _; // Continue with the function
    }

    /// @notice Create a new market statement with fixed commit duration (backwards compatible).
    /// @param ipfsCid Content identifier describing the statement.
    /// @param biddingDuration Duration of the commit phase in seconds.
    /// @param revealDuration Duration of the reveal phase in seconds.
    function submitStatement(string memory ipfsCid, uint256 biddingDuration, uint256 revealDuration) external nonReentrant {
        _submitStatementInternal(ipfsCid, biddingDuration, revealDuration, false, 0);
    }

    /// @notice Create a new market statement with optional random close.
    /// @param ipfsCid Content identifier describing the statement.
    /// @param minCommitDuration Minimum time before random close can trigger (or fixed duration if !enableRandomClose).
    /// @param revealDuration Duration of the reveal phase in seconds.
    /// @param enableRandomClose True = random close, false = fixed time.
    /// @param avgCommitDuration Expected average commit duration (used to calculate difficulty, only for random close).
    function submitStatementWithRandomClose(
        string memory ipfsCid,
        uint256 minCommitDuration,
        uint256 revealDuration,
        bool enableRandomClose,
        uint256 avgCommitDuration
    ) external nonReentrant {
        _submitStatementInternal(ipfsCid, minCommitDuration, revealDuration, enableRandomClose, avgCommitDuration);
    }

    /// @dev Internal function for creating market statements.
    function _submitStatementInternal(
        string memory ipfsCid,
        uint256 minCommitDuration,
        uint256 revealDuration,
        bool enableRandomClose,
        uint256 avgCommitDuration
    ) internal {
        require(bytes(ipfsCid).length > 0, "CID empty");
        require(bytes(ipfsCid).length <= MAX_CID_LENGTH, "CID too long");
        require(minCommitDuration >= MIN_BIDDING_DURATION, "Bidding duration too short");
        require(minCommitDuration <= MAX_DURATION, "Bidding duration too long");
        require(revealDuration >= MIN_REVEAL_DURATION, "Reveal duration too short");
        require(revealDuration <= MAX_DURATION, "Reveal duration too long");

        if (enableRandomClose) {
            require(avgCommitDuration >= minCommitDuration, "Avg duration must be >= min duration");
            require(avgCommitDuration <= MAX_COMMIT_DURATION, "Avg duration too long");
        }

        require(token.transferFrom(msg.sender, address(this), STATEMENT_FEE), "Fee transfer failed");

        uint256 marketId = marketCount++;
        Statement storage s = markets[marketId];
        s.ipfsCid = ipfsCid;
        s.commitEndTime = block.timestamp + minCommitDuration; // Earliest close time for random close
        s.originator = msg.sender;
        s.randomCloseEnabled = enableRandomClose;
        s.revealDuration = revealDuration;

        if (enableRandomClose) {
            // Generate market-specific random seed
            s.closeSeed = keccak256(abi.encodePacked(
                block.timestamp,
                msg.sender,
                marketId,
                blockhash(block.number - 1)
            ));

            // Calculate difficulty target based on avgCommitDuration
            s.difficultyTarget = _calculateDifficultyTarget(avgCommitDuration - minCommitDuration);

            // Force close by avgCommitDuration (ensures markets cannot hang indefinitely).
            s.hardCommitEndTime = block.timestamp + avgCommitDuration;

            // revealEndTime will be set when commit phase closes
            s.revealEndTime = 0; // Placeholder, set when commit phase closes

            // Burn statement fee minus the reserved ping reward.
            require(STATEMENT_FEE >= PING_REWARD, "Fee < ping reward");
            require(token.transfer(BURN_ADDRESS, STATEMENT_FEE - PING_REWARD), "Burn transfer failed");

            emit MarketCreatedWithRandomClose(marketId, s.difficultyTarget, avgCommitDuration);
        } else {
            // Fixed-time market (backwards compatible)
            s.revealEndTime = s.commitEndTime + revealDuration;
            s.difficultyTarget = 0; // Not used
            s.commitPhaseClosed = 0; // Not used for fixed-time markets
            s.hardCommitEndTime = s.commitEndTime;
            require(token.transfer(BURN_ADDRESS, STATEMENT_FEE), "Burn transfer failed");
        }

        emit StatementCreated(marketId, ipfsCid, s.commitEndTime, s.revealEndTime, msg.sender);
    }

    /// @notice Commit a hashed bet during the commit phase.
    /// @param marketId Identifier of the market.
    /// @param commitHash Hash of (choice, salt, bettor address).
    /// @param amount Amount of HLX to stake.
    function commitBet(uint256 marketId, bytes32 commitHash, uint256 amount)
        external
        nonReentrant
        validMarket(marketId)
        checkRandomClose(marketId)
    {
        Statement storage s = markets[marketId];
        require(!s.resolved, "Resolved");

        // Check commit phase is still open
        if (s.randomCloseEnabled) {
            require(s.commitPhaseClosed == 0, "Commit phase closed");
        } else {
            require(block.timestamp < s.commitEndTime, "Commit phase over");
        }

        require(amount > 0, "Amount must be > 0");
        require(!hasCommitted[marketId][msg.sender], "Already committed");

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
    function revealBet(uint256 marketId, uint8 choice, uint256 salt)
        external
        nonReentrant
        validMarket(marketId)
        checkRandomClose(marketId)
    {
        Statement storage s = markets[marketId];
        require(!s.resolved, "Resolved");

        // Check commit phase is closed
        if (s.randomCloseEnabled) {
            require(s.commitPhaseClosed > 0, "Commit phase still open");
        } else {
            require(block.timestamp >= s.commitEndTime, "Commit phase not over");
        }

        require(block.timestamp < s.revealEndTime, "Reveal phase over");

        bytes32 storedHash = commits[marketId][msg.sender];
        require(storedHash != bytes32(0), "No bet committed");

        require(keccak256(abi.encodePacked(choice, salt, msg.sender)) == storedHash, "Invalid hash/reveal");

        uint256 amount = committedAmount[marketId][msg.sender];
        require(amount > 0, "Already revealed or no amount");

        committedAmount[marketId][msg.sender] = 0;

        require(choice <= 2, "Invalid choice");
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
    function resolve(uint256 marketId) external nonReentrant validMarket(marketId) {
        Statement storage s = markets[marketId];
        require(s.revealEndTime != 0, "Reveal not started");
        require(block.timestamp > s.revealEndTime, "Reveal phase not over");
        require(!s.resolved, "Already resolved");

        s.resolved = true;
        (s.tie, s.outcome) = _determineOutcome(s.yesPool, s.noPool);

        uint256 totalPool = s.yesPool + s.noPool + s.unalignedPool;
        uint256 fee = s.tie ? 0 : _calculateFee(totalPool);

        if (fee > 0) {
            require(token.transfer(s.originator, fee), "Fee transfer failed");
        }

        emit MarketResolved(marketId, s.outcome, s.tie, totalPool, fee);
    }

    /// @notice Claim winnings (or refunds in a tie) after resolution.
    /// @param marketId Identifier of the market.
    function claim(uint256 marketId) external nonReentrant validMarket(marketId) {
        Statement storage s = markets[marketId];
        require(s.resolved, "Not resolved");

        (uint256 userBet, uint256 winningPool, uint256 rewardPool) = _payoutInputs(s, marketId);
        require(userBet > 0, "No winning bet");

        _clearUserBets(marketId, s.tie, s.outcome);

        uint8 side = s.tie ? 3 : (s.outcome ? 1 : 0);

        uint256 payout;
        if (s.tie) {
            payout = userBet;
        } else {
            require(rewardPool >= s.claimedRewardPaid, "Claim accounting overflow");
            bool isLastWinner = (s.claimedWinningStake + userBet == winningPool);
            if (isLastWinner) {
                payout = rewardPool - s.claimedRewardPaid;
                s.claimedRewardPaid = rewardPool;
                s.claimedWinningStake = winningPool;
            } else {
                payout = (userBet * rewardPool) / winningPool;
                s.claimedRewardPaid += payout;
                s.claimedWinningStake += userBet;
            }
        }

        require(token.transfer(msg.sender, payout), "Transfer failed");
        emit Claimed(marketId, msg.sender, side, userBet, payout, s.tie);
    }

    /// @notice Withdraw committed HLX that was never revealed once the reveal window has closed.
    /// @dev Applies a 100% burn penalty to discourage forgetting to reveal.
    function withdrawUnrevealed(uint256 marketId) external nonReentrant validMarket(marketId) {
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

    function _determineOutcome(uint256 yesPool, uint256 noPool) internal pure returns (bool tie, bool outcome) {
        if (yesPool > noPool) {
            return (false, true);
        } else if (noPool > yesPool) {
            return (false, false);
        }
        return (true, false);
    }

    function _payoutInputs(Statement storage s, uint256 marketId)
        internal
        view
        returns (uint256 userBet, uint256 winningPool, uint256 rewardPool)
    {
        uint256 totalPool = s.yesPool + s.noPool + s.unalignedPool;
        uint256 fee = s.tie ? 0 : _calculateFee(totalPool);
        rewardPool = totalPool - fee;

        if (s.tie) {
            userBet = bets[marketId][msg.sender][0] + bets[marketId][msg.sender][1] + bets[marketId][msg.sender][2];
            winningPool = totalPool;
        } else if (s.outcome) {
            userBet = bets[marketId][msg.sender][1];
            winningPool = s.yesPool;
        } else {
            userBet = bets[marketId][msg.sender][0];
            winningPool = s.noPool;
        }
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

    /// @notice Calculate difficulty target based on desired average duration
    /// @param avgDuration Expected average time until close (in seconds, after minDuration)
    /// @return Difficulty target (hash must be < this value to close)
    function _calculateDifficultyTarget(uint256 avgDuration) internal pure returns (uint256) {
        // Assume ~1 interaction per 60 seconds (conservative estimate)
        // On active markets, this could be much higher (more frequent closes)
        // On inactive markets, this could be lower (longer closes)

        uint256 expectedInteractions = avgDuration / 60;

        if (expectedInteractions == 0) {
            expectedInteractions = 1; // Minimum
        }

        // Difficulty = max_uint256 / expectedInteractions
        // Higher difficulty = easier to hit = closes faster
        // Lower difficulty = harder to hit = closes slower

        return type(uint256).max / expectedInteractions;
    }

    /// @notice Manually trigger a random close check
    /// @dev Useful for low-activity markets where no one is committing
    /// @param marketId Market to ping
    function pingMarket(uint256 marketId) external nonReentrant validMarket(marketId) checkRandomClose(marketId) {
        // Intentionally empty: the checkRandomClose modifier is the effect.
    }

    /// @notice View function to check current close probability
    /// @param marketId Market to check
    /// @return closeHash Current hash value
    /// @return willClose True if this hash would close the market
    /// @return isRandomCloseEnabled True if market has random close enabled
    /// @return isCommitPhaseOpen True if commit phase is still open
    function previewCloseCheck(uint256 marketId) external view returns (
        bytes32 closeHash,
        bool willClose,
        bool isRandomCloseEnabled,
        bool isCommitPhaseOpen
    ) {
        require(marketId < marketCount, "Invalid market");
        Statement storage s = markets[marketId];

        isRandomCloseEnabled = s.randomCloseEnabled;
        isCommitPhaseOpen = s.randomCloseEnabled ? (s.commitPhaseClosed == 0) : (block.timestamp < s.commitEndTime);

        closeHash = keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            blockhash(block.number - 2),
            blockhash(block.number - 3),
            msg.sender,
            tx.gasprice,
            s.yesPool,
            s.noPool,
            s.unalignedPool,
            s.closeSeed,
            block.timestamp
        ));

        willClose = (s.randomCloseEnabled &&
                     s.commitPhaseClosed == 0 &&
                     block.timestamp >= s.commitEndTime &&
                     (uint256(closeHash) < s.difficultyTarget || block.timestamp >= s.hardCommitEndTime));
    }

    /// @notice Get random close status for a market
    /// @param marketId Market to check
    /// @return randomCloseEnabled True if market uses random close
    /// @return commitPhaseClosed Timestamp when commit phase closed (0 if still open)
    /// @return difficultyTarget Hash difficulty target
    /// @return closeSeed Market-specific entropy seed
    function getRandomCloseStatus(uint256 marketId) external view returns (
        bool randomCloseEnabled,
        uint256 commitPhaseClosed,
        uint256 difficultyTarget,
        bytes32 closeSeed
    ) {
        require(marketId < marketCount, "Invalid market");
        Statement storage s = markets[marketId];
        return (s.randomCloseEnabled, s.commitPhaseClosed, s.difficultyTarget, s.closeSeed);
    }
}
