// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AlphaHelixToken.sol";

contract HelixMarket is ReentrancyGuard, AccessControl {
    AlphaHelixToken public immutable token;
    uint256 public constant STATEMENT_FEE = 100 * 10**18; // 100 HLX
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
    event BetRevealed(uint256 indexed marketId, address indexed user, bool choice, uint256 amount);
    event MarketResolved(uint256 indexed marketId, bool outcome, bool tie, uint256 totalPool, uint256 originatorFee);

    constructor(address _token) {
        token = AlphaHelixToken(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

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

        emit BetRevealed(marketId, msg.sender, choice == 1, amount);
    }

    function resolve(uint256 marketId) external nonReentrant {
        Statement storage s = markets[marketId];
        require(block.timestamp > s.revealEndTime, "Reveal phase not over");
        require(!s.resolved, "Already resolved");

        s.resolved = true;
        uint256 totalPool = s.yesPool + s.noPool + s.unalignedPool;
        uint256 fee = totalPool / 100; // 1%

        if (fee > 0) {
            token.transfer(s.originator, fee);
        }

        bool tie = false;
        if (s.yesPool > s.noPool) {
            s.outcome = true; // YES Wins
        } else if (s.noPool > s.yesPool) {
            s.outcome = false; // NO Wins
        } else {
            tie = true;
        }

        emit MarketResolved(marketId, s.outcome, tie, totalPool, fee);
    }

    function claim(uint256 marketId) external nonReentrant {
        Statement storage s = markets[marketId];
        require(s.resolved, "Not resolved");

        uint256 userBet = 0;
        uint256 winningPool = 0;
        uint256 totalPool = s.yesPool + s.noPool + s.unalignedPool;
        uint256 fee = totalPool / 100;
        uint256 rewardPool = totalPool - fee;

        if (s.yesPool == s.noPool) {
            // Tie
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

        if (s.yesPool == s.noPool) {
             bets[marketId][msg.sender][0] = 0;
             bets[marketId][msg.sender][1] = 0;
             bets[marketId][msg.sender][2] = 0;
        } else if (s.outcome) {
             bets[marketId][msg.sender][1] = 0;
        } else {
             bets[marketId][msg.sender][0] = 0;
        }

        uint256 payout = (userBet * rewardPool) / winningPool;
        require(token.transfer(msg.sender, payout), "Transfer failed");
    }
}
