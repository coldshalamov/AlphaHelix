const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket", function () {
  async function deployHelixMarketFixture() {
    const [owner, userA, userB, userC, userD] = await ethers.getSigners();

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
    await token.mint(userD.address, amount);

    // Approve market to spend tokens
    await token.connect(userA).approve(market.target, amount);
    await token.connect(userB).approve(market.target, amount);
    await token.connect(userC).approve(market.target, amount);
    await token.connect(userD).approve(market.target, amount);

    // Also approve for owner (creator) for fees
    await token.mint(owner.address, amount);
    await token.connect(owner).approve(market.target, amount);

    return { market, token, owner, userA, userB, userC, userD };
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
        const { market, token, userA, userB, userC, userD } = await loadFixture(deployHelixMarketFixture);

        const biddingDuration = 60;
        const revealDuration = 60;
        await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
        const marketId = 0;

        // User A bets 100 YES
        const saltA = 12345;
        const choiceA = 1; // YES
        // Making A's bet slightly higher to ensure win (101 vs 100)
        const amountA = ethers.parseEther("101");
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

        // Time Passes (Reveal Phase Over)
        await ethers.provider.send("evm_increaseTime", [revealDuration + 1]);
        await ethers.provider.send("evm_mine");

        // Resolve Market
        await market.resolve(marketId);

        // Verify Outcome (YES wins)
        const statement = await market.markets(marketId);
        expect(statement.outcome).to.equal(true);

        // User A Claims
        const balanceBefore = await token.balanceOf(userA.address);
        await market.connect(userA).claim(marketId);
        const balanceAfter = await token.balanceOf(userA.address);

        // Total Pool = 101 + 100 + 50 = 251
        // Fee = 251 / 100 = 2.51
        // Reward = 248.49
        // A's Share = (101 / 101) * Reward = 248.49

        const expectedPayout = ethers.parseEther("251") - (ethers.parseEther("251") / 100n);
        expect(balanceAfter - balanceBefore).to.equal(expectedPayout);

        // Verify C cannot claim (revert or 0)
        // Claim reverts if "No winning bet"
        await expect(market.connect(userC).claim(marketId)).to.be.revertedWith("No winning bet");
        await expect(market.connect(userB).claim(marketId)).to.be.revertedWith("No winning bet");
    });
  });
});
