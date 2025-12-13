// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AlphaHelixToken.sol";

contract HelixMarket is ReentrancyGuard, AccessControl {
    AlphaHelixToken public immutable token;
    uint256 public constant STATEMENT_FEE = 100 * 10**18; // 100 HLX
    uint256 public marketCount;

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
    // marketId => user => Bet (stores amount after reveal)
    // Note: We need to track unrevealed amounts too if we want to lock funds.
    // In this design, we transfer funds on commit, so we need to track if they revealed to payout.
    // But we only know the 'side' after reveal.
    mapping(uint256 => mapping(address => bool)) public hasCommitted;

    // Tracking payouts requires knowing how much a user bet on the winning side.
    // marketId => user => side => amount
    // side: 0 = NO, 1 = YES, 2 = UNALIGNED
    mapping(uint256 => mapping(address => mapping(uint8 => uint256))) public bets;

    event StatementCreated(uint256 indexed marketId, string ipfsCid, uint256 commitEndTime, uint256 revealEndTime, address originator);
    event BetCommitted(uint256 indexed marketId, address indexed user, bytes32 commitHash, uint256 amount);
    event BetRevealed(uint256 indexed marketId, address indexed user, bool choice, uint256 amount); // choice true=YES, false=NO. We need a way to represent Unaligned in reveal.
    // Updating revealBet signature to handle Unaligned or just strictly following prompt "choice: bool"
    // Prompt says: "revealBet(uint256 marketId, bool choice, uint256 salt)"
    // And: "Vote (YES/NO/UNALIGNED)" in frontend section.
    // Logic: "If yes > no -> YES Wins. If no > yes -> NO Wins. Else Tie."
    // "Winner Pot = WinnerPool + LoserPool + UnalignedPool."
    // If choice is boolean, how do we bet Unaligned?
    // The prompt for `revealBet` says: "Add funds to yesPool / noPool / unalignedPool based on choice."
    // But choice is `bool`. This implies `unaligned` might not be selectable in `revealBet` based on the strict signature provided in the prompt?
    // Wait, prompt PART 4 says: "Statement: ... yesPool, noPool, unalignedPool..."
    // PART 2 says: "stake HLX tokens on TRUE, FALSE, or UNALIGNED."
    // PART 4 `revealBet`: "Add funds to yesPool / noPool / unalignedPool based on choice."
    // This is a contradiction in the prompt (bool choice vs 3 pools).
    // I will upgrade `choice` to `uint8` (0=NO, 1=YES, 2=UNALIGNED) to satisfy the requirement of 3 pools.
    // However, the prompt EXPLICITLY requested `revealBet(uint256 marketId, bool choice, uint256 salt)`.
    // I will stick to the prompt's signature if possible, but it's impossible to map bool to 3 states.
    // I'll assume the prompt meant `uint8 choice` or similar. I'll use `uint8` for safety and correctness of the "Unaligned" feature.
    // Actually, looking closely at "revealBet": "Add funds to yesPool / noPool / unalignedPool based on choice."
    // If I MUST use `bool`, maybe Unaligned isn't selectable? But Part 1 says "stake HLX tokens on TRUE, FALSE, or UNALIGNED".
    // I will deviate slightly to `uint8 choice` to make the system functional as described.

    event MarketResolved(uint256 indexed marketId, bool outcome, bool tie, uint256 totalPool, uint256 originatorFee);

    constructor(address _token) {
        token = AlphaHelixToken(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function submitStatement(string memory ipfsCid, uint256 biddingDuration, uint256 revealDuration) external {
        require(token.transferFrom(msg.sender, address(this), STATEMENT_FEE), "Fee transfer failed");
        // Burn the fee (send to 0x0 or call burn if allowed). Token has burn function but only for MINTER_ROLE.
        // We can just transfer to 0xdead or similar, or better: if we have burn role.
        // The token contract has `burn(address from, uint256 amount) public onlyRole(MINTER_ROLE)`.
        // The market contract doesn't have MINTER_ROLE by default.
        // I'll just transfer to address(0) to simulate burn, or keep in contract (but prompt says "Burn a fixed fee").
        // I will assume I can burn or just send to 0x0. Let's send to 0x0 for simplicity/safety without roles.
        // token.transfer(address(0), STATEMENT_FEE); -> We just did transferFrom to this, so now we move to 0.
        token.transfer(address(0x000000000000000000000000000000000000dEaD), STATEMENT_FEE);

        uint256 marketId = marketCount++;
        Statement storage s = markets[marketId];
        s.ipfsCid = ipfsCid;
        s.commitEndTime = block.timestamp + biddingDuration;
        s.revealEndTime = s.commitEndTime + revealDuration;
        s.originator = msg.sender;

        emit StatementCreated(marketId, ipfsCid, s.commitEndTime, s.revealEndTime, msg.sender);
    }

    function commitBet(uint256 marketId, bytes32 commitHash, uint256 amount) external {
        Statement storage s = markets[marketId];
        require(block.timestamp < s.commitEndTime, "Commit phase over");
        require(amount > 0, "Amount must be > 0");

        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        commits[marketId][msg.sender] = commitHash;
        hasCommitted[marketId][msg.sender] = true;

        // We track the amount in a temporary way or just trust the transfer.
        // We need to know the amount during reveal to add to pools.
        // But the user could lie about the amount during reveal if we don't store it here.
        // So we MUST store the committed amount.
        // The prompt says "Store hash." under commitBet.
        // But under revealBet it says "Add funds to ... based on choice."
        // We need to know HOW MUCH funds.
        // I will store the amount in a mapping `committedAmount`.
        require(committedAmount[marketId][msg.sender] == 0, "Already committed");
        committedAmount[marketId][msg.sender] = amount;

        emit BetCommitted(marketId, msg.sender, commitHash, amount);
    }

    mapping(uint256 => mapping(address => uint256)) public committedAmount;

    // Adjusted signature to uint8 to support Unaligned
    function revealBet(uint256 marketId, uint8 choice, uint256 salt) external {
        Statement storage s = markets[marketId];
        require(block.timestamp >= s.commitEndTime, "Commit phase not active"); // Wait, strictly > commitEndTime
        require(block.timestamp < s.revealEndTime, "Reveal phase over");

        bytes32 storedHash = commits[marketId][msg.sender];
        require(storedHash != bytes32(0), "No bet committed");

        // Verify hash
        // keccak256(abi.encodePacked(choice, salt, msg.sender)) == storedHash
        // Note: choice must be same type.
        require(keccak256(abi.encodePacked(choice, salt, msg.sender)) == storedHash, "Invalid hash/reveal");

        uint256 amount = committedAmount[marketId][msg.sender];
        require(amount > 0, "Already revealed or no amount");

        // Prevent double reveal
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

        emit BetRevealed(marketId, msg.sender, choice == 1, amount); // Event signature in prompt was bool choice... keeping it boolean for YES, but maybe I should update event too?
        // I'll stick to the prompt's implied simple boolean event for now but the logic handles 3 states.
    }

    function resolve(uint256 marketId) external {
        Statement storage s = markets[marketId];
        require(block.timestamp > s.revealEndTime, "Reveal phase not over");
        require(!s.resolved, "Already resolved");

        s.resolved = true;
        uint256 totalPool = s.yesPool + s.noPool + s.unalignedPool;
        uint256 fee = totalPool / 100; // 1%

        // Originator fee
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

    function claim(uint256 marketId) external {
        Statement storage s = markets[marketId];
        require(s.resolved, "Not resolved");

        uint256 userBet = 0;
        uint256 winningPool = 0;
        uint256 totalPool = s.yesPool + s.noPool + s.unalignedPool;
        uint256 fee = totalPool / 100;
        uint256 rewardPool = totalPool - fee;

        if (s.yesPool == s.noPool) {
            // TIE: Return funds? Or Lock?
            // Prompt says: "If yes > no -> YES Wins. If no > yes -> NO Wins. Else Tie."
            // But doesn't specify Tie payout.
            // Standard practice: Return funds to everyone involved? Or burn?
            // "Winner Pot = WinnerPool + LoserPool + UnalignedPool."
            // In a tie, there is no winner.
            // I will implement: Refund everyone their own bets (minus fee effectively, or pro-rata share of remaining).
            // Actually, if tie, let's just refund.
            // Refund = (UserBet / TotalPool) * RewardPool? No, (UserBet) simply. But we took a fee.
            // Let's do pro-rata share of the rewardPool.
            userBet = bets[marketId][msg.sender][0] + bets[marketId][msg.sender][1] + bets[marketId][msg.sender][2];
            winningPool = totalPool; // Denom is total pool
        } else if (s.outcome) { // YES Won
            userBet = bets[marketId][msg.sender][1];
            winningPool = s.yesPool;
        } else { // NO Won
            userBet = bets[marketId][msg.sender][0];
            winningPool = s.noPool;
        }

        require(userBet > 0, "No winning bet");

        // Prevent double claim
        // We set their bet to 0.
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
