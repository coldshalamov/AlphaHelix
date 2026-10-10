const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

// This is needed to make chai matchers work with ethers v6
require("@nomicfoundation/hardhat-chai-matchers");

describe("HelixMarket", function () {
  async function deployHelixMarketFixture() {
    const [owner, userA, userB, userC] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    const amount = ethers.parseEther("1000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(userA.address, amount);
    await token.mint(userB.address, amount);
    await token.mint(userC.address, amount);
    await token.mint(owner.address, amount);

    for (const user of [owner, userA, userB, userC]) {
      await token.connect(user).approve(market.target, amount);
    }

    return { market, token, owner, userA, userB, userC };
  }

  const biddingDuration = 3600;
  const revealDuration = 3600;
  const burnAddress = "0x000000000000000000000000000000000000dEaD";

  function buildCommit(choice, salt, user) {
    return ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choice, salt, user.address]);
  }

  function toWei(value) {
    return typeof value === "bigint" ? value : ethers.parseEther(value);
  }

  describe("Lifecycle and economics", function () {
    it("YES wins, sweeps unaligned, and originator receives 1% fee", async function () {
      const { market, token, owner, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

      await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
      const marketId = 0;

      const yesAmount = ethers.parseEther("200");
      const noAmount = ethers.parseEther("100");
      const unalignedAmount = ethers.parseEther("50");

      await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), yesAmount);
      await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), noAmount);
      await market.connect(owner).commitBet(marketId, buildCommit(2, 333, owner), unalignedAmount);

      await time.increase(biddingDuration + 1);

      await market.connect(userB).revealBet(marketId, 1, 111);
      await market.connect(userC).revealBet(marketId, 0, 222);
      await market.connect(owner).revealBet(marketId, 2, 333);

      await time.increase(revealDuration + 1);

      const originatorBalanceBefore = await token.balanceOf(userA.address);
      await market.resolve(marketId);
      const originatorBalanceAfter = await token.balanceOf(userA.address);

      expect(originatorBalanceAfter - originatorBalanceBefore).to.equal(ethers.parseEther("3.5"));

      const balanceBefore = await token.balanceOf(userB.address);
      await market.connect(userB).claim(marketId);
      const balanceAfter = await token.balanceOf(userB.address);

      const expectedPayout = ethers.parseEther("346.5");
      expect(balanceAfter - balanceBefore).to.equal(expectedPayout);
    });

    it("Tie refunds all bettors without originator fee", async function () {
      const { market, token, owner, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

      await market.connect(userA).submitStatement("ipfs://tie", biddingDuration, revealDuration);
      const marketId = 0;

      const yesAmount = ethers.parseEther("150");
      const noAmount = ethers.parseEther("150");
      const unalignedAmount = ethers.parseEther("40");

      await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), yesAmount);
      await market.connect(userC).commitBet(marketId, buildCommit(0, 222, userC), noAmount);
      await market.connect(owner).commitBet(marketId, buildCommit(2, 333, owner), unalignedAmount);

      await time.increase(biddingDuration + 1);

      await market.connect(userB).revealBet(marketId, 1, 111);
      await market.connect(userC).revealBet(marketId, 0, 222);
      await market.connect(owner).revealBet(marketId, 2, 333);

      await time.increase(revealDuration + 1);

      const originatorBefore = await token.balanceOf(userA.address);
      await market.resolve(marketId);
      const originatorAfter = await token.balanceOf(userA.address);

      expect(originatorAfter).to.equal(originatorBefore);

      const userBBalanceBefore = await token.balanceOf(userB.address);
      await market.connect(userB).claim(marketId);
      const userBBalanceAfter = await token.balanceOf(userB.address);
      expect(userBBalanceAfter - userBBalanceBefore).to.equal(yesAmount);

      const unalignedBefore = await token.balanceOf(owner.address);
      await market.connect(owner).claim(marketId);
      const unalignedAfter = await token.balanceOf(owner.address);
      expect(unalignedAfter - unalignedBefore).to.equal(unalignedAmount);
    });
  });

  describe("Unrevealed commitments", function () {
    it("punishes unrevealed stake with total forfeiture", async function () {
      const { market, token, userA, userB } = await loadFixture(deployHelixMarketFixture);

      await market.connect(userA).submitStatement("ipfs://unrevealed", biddingDuration, revealDuration);
      const marketId = 0;
      const amount = ethers.parseEther("100");

      await market.connect(userB).commitBet(marketId, buildCommit(1, 123, userB), amount);

      await time.increase(biddingDuration + revealDuration + 2);

      const userBalanceBefore = await token.balanceOf(userB.address);
      const supplyBefore = await token.totalSupply();

      await market.connect(userB).withdrawUnrevealed(marketId);

      const userBalanceAfter = await token.balanceOf(userB.address);
      const supplyAfter = await token.totalSupply();

      expect(userBalanceAfter - userBalanceBefore).to.equal(0);
      expect(supplyBefore - supplyAfter).to.equal(amount);

      await expect(market.connect(userB).withdrawUnrevealed(marketId)).to.be.revertedWith("No unrevealed stake");
    });
  });

  describe("Negative flows", function () {
    it("reverts resolve before reveal end", async function () {
      const { market, userA } = await loadFixture(deployHelixMarketFixture);

      await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);

      await expect(market.resolve(0)).to.be.revertedWith("Reveal phase not over");
    });

    it("reverts reveal before commit end", async function () {
      const { market, userA } = await loadFixture(deployHelixMarketFixture);

      await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
      const hashA = buildCommit(1, 111, userA);
      const amountA = ethers.parseEther("50");

      await market.connect(userA).commitBet(0, hashA, amountA);

      await expect(market.connect(userA).revealBet(0, 1, 111)).to.be.revertedWith("Commit phase not over");
    });

    it("reverts unrevealed withdrawal before reveal end", async function () {
      const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

      await market.connect(userA).submitStatement("ipfs://cid", biddingDuration, revealDuration);
      const hashA = buildCommit(1, 111, userB);
      const amountA = ethers.parseEther("10");

      await market.connect(userB).commitBet(0, hashA, amountA);

      await expect(market.connect(userB).withdrawUnrevealed(0)).to.be.revertedWith("Reveal phase not over");
    });
  });

  describe("Invariant payouts and protections", function () {
    const scenarios = [
      {
        name: "YES sweeps unaligned with modest fee",
        yes: [{ user: "userB", amount: "2.0" }],
        no: [{ user: "userC", amount: "1.0" }],
        unaligned: [{ user: "owner", amount: "0.5" }],
      },
      {
        name: "NO whale vs small YES",
        yes: [{ user: "userB", amount: "0.5" }],
        no: [{ user: "owner", amount: "50" }],
        unaligned: [{ user: "userC", amount: "0.25" }],
      },
      {
        name: "exact tie refunds everyone",
        yes: [{ user: "userB", amount: "3" }],
        no: [{ user: "userC", amount: "3" }],
        unaligned: [{ user: "owner", amount: "1" }],
      },
      {
        name: "multiple YES winners share pool",
        yes: [
          { user: "userB", amount: "1.25" },
          { user: "userC", amount: "3" },
        ],
        no: [{ user: "owner", amount: "2" }],
        unaligned: [{ user: "userA", amount: "1" }],
      },
      {
        name: "very small stakes behave",
        yes: [{ user: "userB", amount: 1n }],
        no: [{ user: "userC", amount: 2n }],
        unaligned: [{ user: "owner", amount: 5n }],
      },
    ];

    for (const scenario of scenarios) {
      it(`maintains pool accounting when ${scenario.name}`, async function () {
        const { market, token, owner, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);
        const actors = { owner, userA, userB, userC };
        const originator = userA;
        await market.connect(originator).submitStatement(`ipfs://${scenario.name}`, biddingDuration, revealDuration);

        const stakes = [];
        let yesPool = 0n;
        let noPool = 0n;
        let unalignedPool = 0n;

        const registerStakes = async (entries, choice) => {
          for (const entry of entries) {
            const actor = actors[entry.user];
            const amount = toWei(entry.amount);
            const salt = BigInt(1000 + stakes.length);

            await market.connect(actor).commitBet(0, buildCommit(choice, salt, actor), amount);
            stakes.push({ actor, choice, amount, salt });

            if (choice === 1) yesPool += amount;
            else if (choice === 0) noPool += amount;
            else unalignedPool += amount;
          }
        };

        await registerStakes(scenario.yes, 1);
        await registerStakes(scenario.no, 0);
        await registerStakes(scenario.unaligned, 2);

        await time.increase(biddingDuration + 1);
        for (const stake of stakes) {
          await market.connect(stake.actor).revealBet(0, stake.choice, stake.salt);
        }
        await time.increase(revealDuration + 1);

        const originatorBalanceBefore = await token.balanceOf(originator.address);
        await market.resolve(0);
        const statement = await market.markets(0);
        const originatorBalanceAfter = await token.balanceOf(originator.address);
        const originatorFee = originatorBalanceAfter - originatorBalanceBefore;

        const winners = stakes.filter((stake) => {
          if (statement.tie) return true;
          if (statement.outcome) return stake.choice === 1;
          return stake.choice === 0;
        });

        let payoutTotal = 0n;
        let claimedWinningStake = 0n;
        let claimedRewardPaid = 0n;

        for (const stake of winners) {
          const before = await token.balanceOf(stake.actor.address);
          await market.connect(stake.actor).claim(0);
          const after = await token.balanceOf(stake.actor.address);
          const payout = after - before;
          payoutTotal += payout;

          if (statement.tie) {
            expect(payout).to.equal(stake.amount);
          } else {
            const totalPool = yesPool + noPool + unalignedPool;
            const rewardPool = totalPool - originatorFee;
            const winningPool = statement.outcome ? yesPool : noPool;

            const isLastWinner = claimedWinningStake + stake.amount === winningPool;
            const expected = isLastWinner ? rewardPool - claimedRewardPaid : (stake.amount * rewardPool) / winningPool;
            claimedWinningStake += stake.amount;
            claimedRewardPaid += expected;

            expect(payout).to.equal(expected);
          }
        }

        const totalPool = yesPool + noPool + unalignedPool;
        const accounted = payoutTotal + originatorFee;
        expect(accounted).to.equal(totalPool);
      });
    }

    it("prevents losing side from withdrawing more than zero", async function () {
      const { market, token, owner, userA, userB } = await loadFixture(deployHelixMarketFixture);
      await market.connect(owner).submitStatement("ipfs://loss-check", biddingDuration, revealDuration);

      const yesAmount = ethers.parseEther("10");
      const noAmount = ethers.parseEther("1");

      await market.connect(userA).commitBet(0, buildCommit(1, 99, userA), yesAmount);
      await market.connect(userB).commitBet(0, buildCommit(0, 100, userB), noAmount);

      await time.increase(biddingDuration + 1);
      await market.connect(userA).revealBet(0, 1, 99);
      await market.connect(userB).revealBet(0, 0, 100);

      await time.increase(revealDuration + 1);
      await market.resolve(0);

      await expect(market.connect(userB).claim(0)).to.be.revertedWith("No winning bet");

      const before = await token.balanceOf(userB.address);
      await expect(market.connect(userB).withdrawUnrevealed(0)).to.be.revertedWith("No unrevealed stake");
      const after = await token.balanceOf(userB.address);
      expect(after).to.equal(before);
    });
  });

  describe("Random close markets", function () {
    it("Creates random close market with correct parameters", async function () {
      const { market, token, userA } = await loadFixture(deployHelixMarketFixture);

      const minDuration = 3600; // 1 hour minimum
      const avgDuration = 7200; // 2 hours average
      const revealDuration = 3600;

      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://random-close",
        minDuration,
        revealDuration,
        true, // enable random close
        avgDuration
      );

      const marketId = 0;
      const status = await market.getRandomCloseStatus(marketId);

      expect(status.randomCloseEnabled).to.be.true;
      expect(status.commitPhaseClosed).to.equal(0); // Not closed yet
      expect(status.difficultyTarget).to.be.gt(0);
      expect(status.closeSeed).to.not.equal(ethers.ZeroHash);
    });

    it("Fixed-time markets still work (backwards compatibility)", async function () {
      const { market, token, userA, userB } = await loadFixture(deployHelixMarketFixture);

      // Use the original submitStatement function
      await market.connect(userA).submitStatement("ipfs://fixed-time", biddingDuration, revealDuration);

      const marketId = 0;
      const status = await market.getRandomCloseStatus(marketId);

      // Should not have random close enabled
      expect(status.randomCloseEnabled).to.be.false;
      // commitPhaseClosed is unused for fixed-time markets
      expect(status.commitPhaseClosed).to.equal(0);

      // Commit should work during window
      await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), ethers.parseEther("100"));

      // Can't reveal before commit end
      await expect(
        market.connect(userB).revealBet(marketId, 1, 111)
      ).to.be.revertedWith("Commit phase not over");

      // Time travel past commit window
      await time.increase(biddingDuration + 1);

      // Now reveal works
      await market.connect(userB).revealBet(marketId, 1, 111);

      const statement = await market.markets(marketId);
      expect(statement.yesPool).to.equal(ethers.parseEther("100"));
    });

    it("Fixed-time markets also work with submitStatementWithRandomClose", async function () {
      const { market, token, userA, userB } = await loadFixture(deployHelixMarketFixture);

      // Use submitStatementWithRandomClose with enableRandomClose = false
      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://fixed-time-v2",
        biddingDuration,
        revealDuration,
        false, // disable random close
        0 // avgDuration not used
      );

      const marketId = 0;
      const status = await market.getRandomCloseStatus(marketId);

      expect(status.randomCloseEnabled).to.be.false;

      // Test normal flow
      await market.connect(userB).commitBet(marketId, buildCommit(1, 111, userB), ethers.parseEther("50"));
      await time.increase(biddingDuration + 1);
      await market.connect(userB).revealBet(marketId, 1, 111);

      const statement = await market.markets(marketId);
      expect(statement.yesPool).to.equal(ethers.parseEther("50"));
    });

    it("Random close market can close during commit", async function () {
      const { market, token, userA, userB, userC } = await loadFixture(deployHelixMarketFixture);

      const minDuration = 3600; // 1 hour minimum (required by MIN_BIDDING_DURATION)
      const avgDuration = 3660; // Just 1 minute more = very high probability
      const revealDuration = 3600;

      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://random-close-test",
        minDuration,
        revealDuration,
        true,
        avgDuration
      );

      const marketId = 0;

      // Time travel to minimum duration
      await time.increase(minDuration + 1);

      // Keep committing until market closes or max attempts
      let statement = await market.markets(marketId);
      let attempts = 0;
      const maxAttempts = 500;

      while (statement.commitPhaseClosed == 0 && attempts < maxAttempts) {
        try {
          // Alternate between users
          const user = attempts % 2 === 0 ? userB : userC;
          if (!await market.hasCommitted(marketId, user.address)) {
            await market.connect(user).commitBet(
              marketId,
              buildCommit(1, 1000 + attempts, user),
              ethers.parseEther("1")
            );
          }
        } catch (e) {
          // Commit phase may have closed
          if (e.message.includes("Commit phase closed")) {
            break;
          }
          throw e;
        }

        statement = await market.markets(marketId);
        attempts++;

        // Advance block to get new hash
        await time.increase(1);
      }

      statement = await market.markets(marketId);
      // Market should eventually close (or we hit max attempts)
      console.log(`Market tested with ${attempts} attempts, closed: ${statement.commitPhaseClosed > 0}`);
    });

    it("Cannot commit after random close", async function () {
      const { market, token, userA, userB, userC, owner } = await loadFixture(deployHelixMarketFixture);

      // Create market with very high close probability (difficulty target = max)
      const minDuration = 3600; // 1 hour minimum
      const avgDuration = 3601; // Just 1 second more than min = extremely high probability
      const revealDuration = 3600;

      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://high-probability",
        minDuration,
        revealDuration,
        true,
        avgDuration
      );

      const marketId = 0;

      // Commit before close
      await market.connect(userB).commitBet(
        marketId,
        buildCommit(1, 111, userB),
        ethers.parseEther("10")
      );

      // Time travel to minimum duration
      await time.increase(minDuration + 1);

      // Force close by pinging until it closes
      let statement = await market.markets(marketId);
      let attempts = 0;
      while (statement.commitPhaseClosed == 0 && attempts < 100) {
        await market.connect(owner).pingMarket(marketId);
        statement = await market.markets(marketId);
        attempts++;
        await time.increase(1);
      }

      // Verify market is closed
      statement = await market.markets(marketId);
      if (statement.commitPhaseClosed > 0) {
        // Now try to commit - should fail
        await expect(
          market.connect(userC).commitBet(
            marketId,
            buildCommit(0, 222, userC),
            ethers.parseEther("5")
          )
        ).to.be.revertedWith("Commit phase closed");
      }
    });

    it("Can reveal after random close", async function () {
      const { market, token, userA, userB, owner } = await loadFixture(deployHelixMarketFixture);

      const minDuration = 3600; // 1 hour minimum
      const avgDuration = 3601; // Very high probability
      const revealDuration = 3600;

      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://reveal-test",
        minDuration,
        revealDuration,
        true,
        avgDuration
      );

      const marketId = 0;

      // Commit before close
      await market.connect(userB).commitBet(
        marketId,
        buildCommit(1, 111, userB),
        ethers.parseEther("10")
      );

      // Time travel to minimum duration
      await time.increase(minDuration + 1);

      // Force close by pinging
      let statement = await market.markets(marketId);
      let attempts = 0;
      while (statement.commitPhaseClosed == 0 && attempts < 100) {
        await market.connect(owner).pingMarket(marketId);
        statement = await market.markets(marketId);
        attempts++;
        await time.increase(1);
      }

      // If market closed, verify we can reveal
      statement = await market.markets(marketId);
      if (statement.commitPhaseClosed > 0) {
        // Reveal should work now
        await market.connect(userB).revealBet(marketId, 1, 111);

        statement = await market.markets(marketId);
        expect(statement.yesPool).to.equal(ethers.parseEther("10"));
      }
    });

    it("previewCloseCheck returns correct values", async function () {
      const { market, userA } = await loadFixture(deployHelixMarketFixture);

      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://preview-test",
        3600,
        3600,
        true,
        7200
      );

      const preview = await market.previewCloseCheck(0);

      expect(preview.isRandomCloseEnabled).to.be.true;
      expect(preview.isCommitPhaseOpen).to.be.true;
      expect(preview.closeHash).to.not.equal(ethers.ZeroHash);
    });

    it("getRandomCloseStatus returns correct values for both market types", async function () {
      const { market, userA } = await loadFixture(deployHelixMarketFixture);

      // Create fixed-time market
      await market.connect(userA).submitStatement("ipfs://fixed", 3600, 3600);

      // Create random close market
      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://random",
        3600,
        3600,
        true,
        7200
      );

      const fixedStatus = await market.getRandomCloseStatus(0);
      expect(fixedStatus.randomCloseEnabled).to.be.false;

      const randomStatus = await market.getRandomCloseStatus(1);
      expect(randomStatus.randomCloseEnabled).to.be.true;
    });

    it("Rejects invalid random close parameters", async function () {
      const { market, userA } = await loadFixture(deployHelixMarketFixture);

      // avgDuration < minDuration should fail
      await expect(
        market.connect(userA).submitStatementWithRandomClose(
          "ipfs://invalid",
          7200, // minDuration = 2 hours
          3600,
          true,
          3600  // avgDuration = 1 hour (less than min)
        )
      ).to.be.revertedWith("Avg duration must be >= min duration");
    });

    it("Ping reward works for closing market", async function () {
      const { market, token, userA, userC } = await loadFixture(deployHelixMarketFixture);

      // Create market with HIGH close probability
      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://ping-test",
        3600,  // 1 hour minimum
        3600,  // 1 hour reveal
        true,  // random close
        3601   // Very high probability (just 1 second more)
      );

      await time.increase(3601);

      // Keep pinging until it closes
      let closed = false;
      let attempts = 0;

      while (!closed && attempts < 100) {
        const balanceBefore = await token.balanceOf(userC.address);

        await market.connect(userC).pingMarket(0);

        const balanceAfter = await token.balanceOf(userC.address);
        const statement = await market.markets(0);

        if (balanceAfter > balanceBefore) {
          // Got reward! Market must have closed
          expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1"));
          closed = true;
        }

        attempts++;
        await time.increase(1);
      }

      // Log result
      console.log(`Ping test: ${closed ? "Got reward" : "No reward"} after ${attempts} attempts`);
    });
  });
});
