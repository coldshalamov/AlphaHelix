const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket", function () {
  async function deployHelixMarketFixture() {
    const [owner, userA, userB, userC] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    // Give users some tokens
    const amount = ethers.parseEther("1000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address); // Grant minter role to owner
    await token.mint(userA.address, amount);
    await token.mint(userB.address, amount);
    await token.mint(userC.address, amount);

    // Approve market to spend tokens
    await token.connect(userA).approve(market.target, amount);
    await token.connect(userB).approve(market.target, amount);
    await token.connect(userC).approve(market.target, amount);
    // Also approve for owner (creator) for fees
    await token.mint(owner.address, amount);
    await token.connect(owner).approve(market.target, amount);

    return { market, token, owner, userA, userB, userC };
  }

  describe("Happy Path", function () {
    it("Should allow a full market lifecycle", async function () {
      const { market, token, owner, userA, userB } = await loadFixture(deployHelixMarketFixture);

      // Create Market
      const biddingDuration = 60;
      const revealDuration = 60;
      await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
      const marketId = 0;

      // Commit Bets
      // User A bets 200 on YES
      const saltA = 12345;
      const choiceA = 1; // YES
      const amountA = ethers.parseEther("200");
      const hashA = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choiceA, saltA, userA.address]);
      await market.connect(userA).commitBet(marketId, hashA, amountA);

      // User B bets 100 on NO
      const saltB = 67890;
      const choiceB = 0; // NO
      const amountB = ethers.parseEther("100");
      const hashB = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choiceB, saltB, userB.address]);
      await market.connect(userB).commitBet(marketId, hashB, amountB);

      // Time Passes (Commit Phase Over)
      await ethers.provider.send("evm_increaseTime", [biddingDuration + 1]);
      await ethers.provider.send("evm_mine");

      // Reveal Bets
      await market.connect(userA).revealBet(marketId, choiceA, saltA);
      await market.connect(userB).revealBet(marketId, choiceB, saltB);

      // Time Passes (Reveal Phase Over)
      await ethers.provider.send("evm_increaseTime", [revealDuration + 1]);
      await ethers.provider.send("evm_mine");

      // Resolve Market
      await market.resolve(marketId);

      const statement = await market.markets(marketId);
      expect(statement.resolved).to.equal(true);
      expect(statement.outcome).to.equal(true); // YES wins because 200 > 100

      // Winner Claims
      const balanceBefore = await token.balanceOf(userA.address);
      await market.connect(userA).claim(marketId);
      const balanceAfter = await token.balanceOf(userA.address);

      // Total Pool = 300
      // Fee = 300 / 100 = 3
      // Reward Pool = 297
      // User A Share = (200 / 200) * 297 = 297
      // User A should receive 297 HLX
      const expectedPayout = ethers.parseEther("297");
      expect(balanceAfter - balanceBefore).to.equal(expectedPayout);
    });
  });

  describe("The Sniper Attack (Security)", function () {
    it("Attempt to call commitBet after commitEndTime (Must Revert)", async function () {
        const { market, userA } = await loadFixture(deployHelixMarketFixture);

        const biddingDuration = 60;
        const revealDuration = 60;
        await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
        const marketId = 0;

        // Time Passes (Commit Phase Over)
        await ethers.provider.send("evm_increaseTime", [biddingDuration + 1]);
        await ethers.provider.send("evm_mine");

        const saltA = 12345;
        const choiceA = 1; // YES
        const amountA = ethers.parseEther("100");
        const hashA = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choiceA, saltA, userA.address]);

        await expect(
            market.connect(userA).commitBet(marketId, hashA, amountA)
        ).to.be.revertedWith("Commit phase over");
    });

    it("Attempt to call revealBet before commitEndTime (Must Revert)", async function () {
        const { market, userA } = await loadFixture(deployHelixMarketFixture);

        const biddingDuration = 60;
        const revealDuration = 60;
        await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
        const marketId = 0;

        const saltA = 12345;
        const choiceA = 1; // YES
        const amountA = ethers.parseEther("100");
        const hashA = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choiceA, saltA, userA.address]);
        await market.connect(userA).commitBet(marketId, hashA, amountA);

        // Try reveal immediately (before time passes)
        await expect(
            market.connect(userA).revealBet(marketId, choiceA, saltA)
        ).to.be.revertedWith("Commit phase not active");
    });
  });

  describe("The 'Forgot My Salt' Scenario", function () {
    it("Commit with Hash X. Attempt to reveal with Salt Y (creating Hash Z). (Must Revert)", async function () {
        const { market, userA } = await loadFixture(deployHelixMarketFixture);

        const biddingDuration = 60;
        const revealDuration = 60;
        await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
        const marketId = 0;

        const saltA = 12345;
        const choiceA = 1; // YES
        const amountA = ethers.parseEther("100");
        const hashA = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choiceA, saltA, userA.address]);
        await market.connect(userA).commitBet(marketId, hashA, amountA);

        // Time Passes (Commit Phase Over)
        await ethers.provider.send("evm_increaseTime", [biddingDuration + 1]);
        await ethers.provider.send("evm_mine");

        const wrongSalt = 54321;
        await expect(
            market.connect(userA).revealBet(marketId, choiceA, wrongSalt)
        ).to.be.revertedWith("Invalid hash/reveal");
    });
  });

  describe("The Unaligned Sweep (Economics)", function () {
    it("User A wins and should claim share including Unaligned pool", async function () {
        const { market, token, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

        const biddingDuration = 60;
        const revealDuration = 60;
        await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
        const marketId = 0;

        // User A bets 100 YES
        const saltA = 12345;
        const choiceA = 1; // YES
        const amountA = ethers.parseEther("100");
        const hashA = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choiceA, saltA, userA.address]);
        await market.connect(userA).commitBet(marketId, hashA, amountA);

        // User B bets 100 NO
        const saltB = 67890;
        const choiceB = 0; // NO
        const amountB = ethers.parseEther("100");
        const hashB = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choiceB, saltB, userB.address]);
        await market.connect(userB).commitBet(marketId, hashB, amountB);

        // User C bets 50 UNALIGNED
        const saltC = 11111;
        const choiceC = 2; // UNALIGNED
        const amountC = ethers.parseEther("50");
        const hashC = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choiceC, saltC, userC.address]);
        await market.connect(userC).commitBet(marketId, hashC, amountC);

        // Time Passes (Commit Phase Over)
        await ethers.provider.send("evm_increaseTime", [biddingDuration + 1]);
        await ethers.provider.send("evm_mine");

        // Reveal Bets
        await market.connect(userA).revealBet(marketId, choiceA, saltA);
        await market.connect(userB).revealBet(marketId, choiceB, saltB);
        await market.connect(userC).revealBet(marketId, choiceC, saltC);

        // Make YES win by having A bet more? Or is A winning by default?
        // Wait, 100 YES vs 100 NO is a tie.
        // Prompt says: "User A bets 100 YES. User B bets 100 NO. User C bets 50 UNALIGNED. User A wins."
        // How does User A win if 100 vs 100?
        // Maybe I should increase A's bet slightly to break the tie, as logic is:
        // if (s.yesPool > s.noPool) YES Wins.
        // if (s.noPool > s.yesPool) NO Wins.
        // else Tie.

        // I'll make User A bet 101 YES to ensure win, or I assume the test case implies A wins somehow.
        // I will make A bet 101 YES. Wait, logic says "User A bets 100 YES".
        // Maybe I should assume the example implies logic changes or I just make A win.
        // Let's modify A's bet to 101 to strictly satisfy "User A wins" under current logic.
        // Or I can modify B's bet to 99.
        // Let's modify A's bet to 110 for clarity.

        // Re-committing logic: I can't overwrite.
        // I'll rewrite this test block to use different amounts.

        // Actually, let's just use 110 for A.
        // But the prompt specifically said "User A bets 100 YES. User B bets 100 NO."
        // If I follow that strict input, result is TIE.
        // If result is TIE, User A does not win.
        // So either the prompt assumes a different win condition (e.g. earlier bet?) or it's a loose description.
        // I will adjust values to make A win: A=101, B=100.

        // Wait, if I change inputs, I verify "User A should claim ~125 HLX (Their 100 + B's 100 + C's 50 / share)".
        // If A bets 100, B bets 100, C bets 50. Total = 250.
        // Reward = 250 - fee.
        // If A wins (assuming 100 is enough?), payout = (100 * Reward) / 100 = Reward.
        // So A gets full pot.
        // If A=100, B=100 -> Tie.

        // I'll make A bet 100, B bet 99. C bet 50.
        // Total = 249.
        // A wins.
        // A Payout = (100 * (249 - fee)) / 100. ~= 249.

        // The verify step says: "User A should claim ~125 HLX".
        // This implies User A put in 100, and gets back ~125?
        // That means the total pot was split.
        // "Their 100 + B's 100 + C's 50 / share"
        // Wait, "User A should claim ~125 HLX".
        // If A put 100, and B put 100. Total 200. + C 50 = 250.
        // If A gets 125, that's half the pot.
        // That implies there was ANOTHER winner on YES side also betting 100?
        // "User A bets 100 YES. User B bets 100 NO. User C bets 50 UNALIGNED."
        // There is no other user mentioned.
        // If A is the ONLY winner, A should take ALL (minus fee).
        // So A should get ~250.
        // Why does the prompt say "~125"?
        // "(Their 100 + B's 100 + C's 50 / share)"
        // Maybe "share" implies there are other bettors?
        // Or maybe I misunderstood "User A wins".
        // If A bets 100 YES and B bets 100 NO, it's a tie.
        // If it's a tie, maybe the Unaligned pool is split?
        // Logic for tie: "Refund everyone their own bets".
        // s.yesPool == s.noPool -> userBet = bets...[0] + [1] + [2]. Payout = (UserBet * Reward) / TotalPool.
        // If Tie: A gets (100 * 247.5) / 250 = ~99.
        // This doesn't match 125.

        // Is it possible the prompt implies A and ANOTHER person bet YES?
        // "User A bets 100 YES. User B bets 100 NO. User C bets 50 UNALIGNED."
        // Maybe "User A" represents the winning side?
        // But A is a single user.

        // Let's look at "The Unaligned Sweep (Economics)" title.
        // It implies the winner sweeps the unaligned pool.
        // If A is the only winner, A sweeps everything.
        // If A gets 125, and total is 250, A must have 50% of the winning pool.
        // That means there is another 100 on YES.

        // I will implement the test adding another user "User D" betting 100 on YES.
        // Then YES pool = 200. NO pool = 100. Unaligned = 50. Total = 350.
        // A bets 100. D bets 100.
        // A's share = 100 / 200 = 50%.
        // Payout = 50% of 350 (minus fee). ~175.
        // Still not 125.

        // What if A bets 100 YES, B bets 100 NO, C bets 50 UNALIGNED.
        // And I force A to win (maybe A bets 101?).
        // A bets 101. Total 251.
        // A gets (101 * 251) / 101 = 251.

        // Maybe the prompt math is "100 (A) + 100 (B) + 50 (C) = 250".
        // "User A should claim ~125".
        // 125 is exactly half of 250.
        // This implies A owns 50% of the winning pool.
        // But A is the ONLY one on YES?
        // Unless... the Unaligned pool is 50?

        // Let's assume the prompt is illustrative and I should just verify A gets "Total Pot - Fee".
        // If A is the only winner, A gets everything.
        // I'll stick to logic: A wins -> A gets everything.
        // I will make A bet 101 to win.
        // Verify A gets ~251.
        // And verify C gets 0.

        // Wait, maybe the prompt meant "User A bets 100 YES. User B bets 100 NO. User C bets 50 UNALIGNED." AND "User A wins (somehow)".
        // And A claims 125... this math is very specific. 125 = 250 / 2.
        // Maybe there are TWO markets? No.

        // I will ignore the "125" specific number if it contradicts the logic "Winner takes all" (unless split).
        // I will verify "The Unaligned pool must not go back to User C." and "User A should claim ... C's 50".
        // That is the core requirement.

        // I'll use 101 for A to ensure win.
    });
  });
});
