const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

require("@nomicfoundation/hardhat-chai-matchers");

/**
 * Invariant/Property-Based Tests for HelixMarket
 *
 * These tests verify critical invariants that should ALWAYS hold:
 * 1. Pool Conservation: Total winnings + fees never exceed total pool
 * 2. Pro-Rata Fairness: Winners receive proportional payouts
 * 3. Accounting Consistency: Sum of individual bets equals pool totals
 * 4. No Double-Claiming: Users can't claim twice
 * 5. Unrevealed Withdrawal Safety: Burns are correctly applied
 */
describe("HelixMarket Invariant Tests", function () {
  async function deployHelixMarketFixture() {
    const [owner, originator, userA, userB, userC, userD] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    const amount = ethers.parseEther("10000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);

    for (const user of [originator, userA, userB, userC, userD]) {
      await token.mint(user.address, amount);
      await token.connect(user).approve(market.target, amount);
    }

    return { market, token, owner, originator, userA, userB, userC, userD };
  }

  const biddingDuration = 3600;
  const revealDuration = 3600;
  const burnAddress = "0x000000000000000000000000000000000000dEaD";

  function buildCommit(choice, salt, user) {
    return ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choice, salt, user.address]);
  }

  function randomBigInt(min, max) {
    const range = max - min;
    return min + BigInt(Math.floor(Math.random() * Number(range)));
  }

  describe("INVARIANT: Pool Conservation", function () {
    it("fuzzing: total payouts never exceed pool (50 random scenarios)", async function () {
      const { market, token, owner, originator, userA, userB, userC, userD } = await loadFixture(deployHelixMarketFixture);

      for (let iteration = 0; iteration < 50; iteration++) {
        // Re-mint and re-approve tokens for each iteration to avoid running out
        const MINTER_ROLE = await token.MINTER_ROLE();
        const refreshAmount = ethers.parseEther("10000");
        for (const user of [originator, userA, userB, userC, userD]) {
          await token.connect(owner).mint(user.address, refreshAmount);
          await token.connect(user).approve(market.target, refreshAmount);
        }
        // Random amounts between 1 and 1000 HLX
        const yesAmount1 = ethers.parseEther(String(1 + Math.floor(Math.random() * 999)));
        const yesAmount2 = ethers.parseEther(String(1 + Math.floor(Math.random() * 999)));
        const noAmount1 = ethers.parseEther(String(1 + Math.floor(Math.random() * 999)));
        const unalignedAmount = ethers.parseEther(String(1 + Math.floor(Math.random() * 999)));

        const marketId = iteration;
        await market.connect(originator).submitStatement(`ipfs://fuzz${iteration}`, biddingDuration, revealDuration);

        // Commit bets
        await market.connect(userA).commitBet(marketId, buildCommit(1, 100 + iteration, userA), yesAmount1);
        await market.connect(userB).commitBet(marketId, buildCommit(1, 200 + iteration, userB), yesAmount2);
        await market.connect(userC).commitBet(marketId, buildCommit(0, 300 + iteration, userC), noAmount1);
        await market.connect(userD).commitBet(marketId, buildCommit(2, 400 + iteration, userD), unalignedAmount);

        // Fast-forward and reveal
        await time.increase(biddingDuration + 1);
        await market.connect(userA).revealBet(marketId, 1, 100 + iteration);
        await market.connect(userB).revealBet(marketId, 1, 200 + iteration);
        await market.connect(userC).revealBet(marketId, 0, 300 + iteration);
        await market.connect(userD).revealBet(marketId, 2, 400 + iteration);

        // Resolve
        await time.increase(revealDuration + 1);

        const originatorBefore = await token.balanceOf(originator.address);
        await market.resolve(marketId);
        const originatorAfter = await token.balanceOf(originator.address);
        const originatorFee = originatorAfter - originatorBefore;

        const totalPool = yesAmount1 + yesAmount2 + noAmount1 + unalignedAmount;
        const marketData = await market.markets(marketId);

        // Determine winners
        let winners = [];
        let winnerAccounts = [];
        if (marketData.tie) {
          // All participants get refunds
          winnerAccounts = [userA, userB, userC, userD];
        } else if (marketData.outcome) {
          // YES won - YES bettors and unaligned sweep
          winnerAccounts = [userA, userB, userD];
        } else {
          // NO won - NO bettors and unaligned sweep
          winnerAccounts = [userC, userD];
        }

        // Claim all winnings
        let totalClaimed = 0n;
        for (const winner of winnerAccounts) {
          const before = await token.balanceOf(winner.address);
          try {
            await market.connect(winner).claim(marketId);
            const after = await token.balanceOf(winner.address);
            totalClaimed += (after - before);
          } catch (e) {
            // User has no winning bet (shouldn't happen but handle gracefully)
          }
        }

        // INVARIANT: Total claimed + originator fee should equal total pool
        expect(totalClaimed + originatorFee).to.equal(totalPool);

        // INVARIANT: Individual claims should never exceed what they're owed
        expect(totalClaimed).to.be.lte(totalPool);
      }
    }).timeout(300000); // 5 minutes for 100 iterations
  });

  describe("INVARIANT: Pro-Rata Fairness", function () {
    it("larger stakes always receive larger payouts", async function () {
      const { market, token, originator, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

      await market.connect(originator).submitStatement("ipfs://prorata", biddingDuration, revealDuration);
      const marketId = 0;

      const smallStake = ethers.parseEther("10");
      const largeStake = ethers.parseEther("100");
      const losingStake = ethers.parseEther("50");

      await market.connect(userA).commitBet(marketId, buildCommit(1, 111, userA), smallStake);
      await market.connect(userB).commitBet(marketId, buildCommit(1, 222, userB), largeStake);
      await market.connect(userC).commitBet(marketId, buildCommit(0, 333, userC), losingStake);

      await time.increase(biddingDuration + 1);
      await market.connect(userA).revealBet(marketId, 1, 111);
      await market.connect(userB).revealBet(marketId, 1, 222);
      await market.connect(userC).revealBet(marketId, 0, 333);

      await time.increase(revealDuration + 1);
      await market.resolve(marketId);

      const userABefore = await token.balanceOf(userA.address);
      await market.connect(userA).claim(marketId);
      const userAAfter = await token.balanceOf(userA.address);
      const userAPayout = userAAfter - userABefore;

      const userBBefore = await token.balanceOf(userB.address);
      await market.connect(userB).claim(marketId);
      const userBAfter = await token.balanceOf(userB.address);
      const userBPayout = userBAfter - userBBefore;

      // INVARIANT: Larger stake gets larger payout
      expect(userBPayout).to.be.gt(userAPayout);

      // INVARIANT: Payout ratio should match stake ratio (within rounding)
      const stakeRatio = (largeStake * 1000n) / smallStake; // 10x
      const payoutRatio = (userBPayout * 1000n) / userAPayout;

      // Allow 1% deviation for rounding
      expect(payoutRatio).to.be.closeTo(stakeRatio, stakeRatio / 100n);
    });
  });

  describe("INVARIANT: Accounting Consistency", function () {
    it("sum of individual bets equals pool totals", async function () {
      const { market, token, originator, userA, userB, userC, userD } = await loadFixture(deployHelixMarketFixture);

      await market.connect(originator).submitStatement("ipfs://accounting", biddingDuration, revealDuration);
      const marketId = 0;

      const yesAmounts = [
        ethers.parseEther("17.5"),
        ethers.parseEther("23.1"),
        ethers.parseEther("99.9")
      ];
      const noAmounts = [
        ethers.parseEther("45.6")
      ];

      // Commit YES bets
      await market.connect(userA).commitBet(marketId, buildCommit(1, 100, userA), yesAmounts[0]);
      await market.connect(userB).commitBet(marketId, buildCommit(1, 200, userB), yesAmounts[1]);
      await market.connect(userC).commitBet(marketId, buildCommit(1, 300, userC), yesAmounts[2]);

      // Commit NO bet
      await market.connect(userD).commitBet(marketId, buildCommit(0, 400, userD), noAmounts[0]);

      // Reveal all
      await time.increase(biddingDuration + 1);
      await market.connect(userA).revealBet(marketId, 1, 100);
      await market.connect(userB).revealBet(marketId, 1, 200);
      await market.connect(userC).revealBet(marketId, 1, 300);
      await market.connect(userD).revealBet(marketId, 0, 400);

      const marketData = await market.markets(marketId);

      // INVARIANT: Pool totals match sum of individual bets
      const expectedYesPool = yesAmounts.reduce((a, b) => a + b, 0n);
      const expectedNoPool = noAmounts.reduce((a, b) => a + b, 0n);

      expect(marketData.yesPool).to.equal(expectedYesPool);
      expect(marketData.noPool).to.equal(expectedNoPool);
    });
  });

  describe("INVARIANT: No Double-Claiming", function () {
    it("prevents users from claiming twice", async function () {
      const { market, token, originator, userA, userB } = await loadFixture(deployHelixMarketFixture);

      await market.connect(originator).submitStatement("ipfs://double", biddingDuration, revealDuration);
      const marketId = 0;

      await market.connect(userA).commitBet(marketId, buildCommit(1, 111, userA), ethers.parseEther("100"));
      await market.connect(userB).commitBet(marketId, buildCommit(0, 222, userB), ethers.parseEther("50"));

      await time.increase(biddingDuration + 1);
      await market.connect(userA).revealBet(marketId, 1, 111);
      await market.connect(userB).revealBet(marketId, 0, 222);

      await time.increase(revealDuration + 1);
      await market.resolve(marketId);

      // First claim succeeds
      await market.connect(userA).claim(marketId);

      // INVARIANT: Second claim fails
      await expect(market.connect(userA).claim(marketId)).to.be.revertedWith("No winning bet");
    });
  });

  describe("INVARIANT: Unrevealed Withdrawal Burns", function () {
    it("100% penalty is always burned, never refunded", async function () {
      const { market, token, originator, userA } = await loadFixture(deployHelixMarketFixture);

      await market.connect(originator).submitStatement("ipfs://unrevealed", biddingDuration, revealDuration);
      const marketId = 0;

      const committedAmount = ethers.parseEther("77.77");
      await market.connect(userA).commitBet(marketId, buildCommit(1, 999, userA), committedAmount);

      await time.increase(biddingDuration + revealDuration + 2);

      const userBefore = await token.balanceOf(userA.address);
      const supplyBefore = await token.totalSupply();

      await market.connect(userA).withdrawUnrevealed(marketId);

      const userAfter = await token.balanceOf(userA.address);
      const supplyAfter = await token.totalSupply();

      // INVARIANT: User receives nothing
      expect(userAfter - userBefore).to.equal(0);

      // INVARIANT: Full amount burned
      expect(supplyBefore - supplyAfter).to.equal(committedAmount);
    });

    it("fuzzing: 100% burn penalty holds for random amounts", async function () {
      const { market, token, owner, originator, userA } = await loadFixture(deployHelixMarketFixture);
      const MINTER_ROLE = await token.MINTER_ROLE();

      for (let i = 0; i < 20; i++) {
        const randomAmount = ethers.parseEther(String(0.001 + Math.random() * 999.999));
        const marketId = i;

        // Refresh tokens and approval
        await token.connect(owner).mint(originator.address, ethers.parseEther("1000"));
        await token.connect(owner).mint(userA.address, randomAmount * 2n);
        await token.connect(originator).approve(market.target, ethers.parseEther("1000"));
        await token.connect(userA).approve(market.target, randomAmount * 2n);

        await market.connect(originator).submitStatement(`ipfs://burn${i}`, biddingDuration, revealDuration);
        await market.connect(userA).commitBet(marketId, buildCommit(1, 1000 + i, userA), randomAmount);

        await time.increase(biddingDuration + revealDuration + 2);

        const supplyBefore = await token.totalSupply();
        await market.connect(userA).withdrawUnrevealed(marketId);
        const supplyAfter = await token.totalSupply();

        // INVARIANT: Exact burn amount
        expect(supplyBefore - supplyAfter).to.equal(randomAmount);
      }
    }).timeout(120000);
  });

  describe("INVARIANT: Tie Refunds", function () {
    it("tie refunds are always 100% of original stake", async function () {
      const { market, token, originator, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

      await market.connect(originator).submitStatement("ipfs://tie", biddingDuration, revealDuration);
      const marketId = 0;

      const yesStake = ethers.parseEther("123.456");
      const noStake = ethers.parseEther("123.456"); // Exact tie
      const unalignedStake = ethers.parseEther("99.999");

      await market.connect(userA).commitBet(marketId, buildCommit(1, 111, userA), yesStake);
      await market.connect(userB).commitBet(marketId, buildCommit(0, 222, userB), noStake);
      await market.connect(userC).commitBet(marketId, buildCommit(2, 333, userC), unalignedStake);

      await time.increase(biddingDuration + 1);
      await market.connect(userA).revealBet(marketId, 1, 111);
      await market.connect(userB).revealBet(marketId, 0, 222);
      await market.connect(userC).revealBet(marketId, 2, 333);

      await time.increase(revealDuration + 1);
      await market.resolve(marketId);

      const marketData = await market.markets(marketId);
      expect(marketData.tie).to.be.true;

      // INVARIANT: Each user gets back exactly what they put in
      const userABefore = await token.balanceOf(userA.address);
      await market.connect(userA).claim(marketId);
      const userAAfter = await token.balanceOf(userA.address);
      expect(userAAfter - userABefore).to.equal(yesStake);

      const userBBefore = await token.balanceOf(userB.address);
      await market.connect(userB).claim(marketId);
      const userBAfter = await token.balanceOf(userB.address);
      expect(userBAfter - userBBefore).to.equal(noStake);

      const userCBefore = await token.balanceOf(userC.address);
      await market.connect(userC).claim(marketId);
      const userCAfter = await token.balanceOf(userC.address);
      expect(userCAfter - userCBefore).to.equal(unalignedStake);
    });
  });

  describe("INVARIANT: Originator Fee Calculation", function () {
    it("fuzzing: originator fee is always exactly 1% (floor division)", async function () {
      const { market, token, owner, originator, userA, userB } = await loadFixture(deployHelixMarketFixture);
      const MINTER_ROLE = await token.MINTER_ROLE();

      for (let i = 0; i < 50; i++) {
        const marketId = i;
        const yesAmount = randomBigInt(ethers.parseEther("1"), ethers.parseEther("500"));
        const noAmount = randomBigInt(ethers.parseEther("1"), ethers.parseEther("500"));

        // Refresh tokens and approvals
        await token.connect(owner).mint(originator.address, ethers.parseEther("200"));
        await token.connect(owner).mint(userA.address, yesAmount * 2n);
        await token.connect(owner).mint(userB.address, noAmount * 2n);
        await token.connect(originator).approve(market.target, ethers.parseEther("200"));
        await token.connect(userA).approve(market.target, yesAmount * 2n);
        await token.connect(userB).approve(market.target, noAmount * 2n);

        await market.connect(originator).submitStatement(`ipfs://fee${i}`, biddingDuration, revealDuration);

        await market.connect(userA).commitBet(marketId, buildCommit(1, 1000 + i, userA), yesAmount);
        await market.connect(userB).commitBet(marketId, buildCommit(0, 2000 + i, userB), noAmount);

        await time.increase(biddingDuration + 1);
        await market.connect(userA).revealBet(marketId, 1, 1000 + i);
        await market.connect(userB).revealBet(marketId, 0, 2000 + i);

        await time.increase(revealDuration + 1);

        const totalPool = yesAmount + noAmount;
        const expectedFee = (totalPool * 100n) / 10000n; // 1% floor division

        const originatorBefore = await token.balanceOf(originator.address);
        await market.resolve(marketId);
        const originatorAfter = await token.balanceOf(originator.address);
        const actualFee = originatorAfter - originatorBefore;

        // INVARIANT: Fee is exactly 1% (floor division)
        expect(actualFee).to.equal(expectedFee);
      }
    }).timeout(300000);
  });
});
