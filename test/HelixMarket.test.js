const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

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

  const biddingDuration = 60;
  const revealDuration = 60;
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
    it("allows withdrawing unrevealed stake with a small burn penalty", async function () {
      const { market, token, userA, userB } = await loadFixture(deployHelixMarketFixture);

      await market.connect(userA).submitStatement("ipfs://unrevealed", biddingDuration, revealDuration);
      const marketId = 0;
      const amount = ethers.parseEther("100");

      await market.connect(userB).commitBet(marketId, buildCommit(1, 123, userB), amount);

      await time.increase(biddingDuration + revealDuration + 2);

      const userBalanceBefore = await token.balanceOf(userB.address);
      const burnBefore = await token.balanceOf(burnAddress);

      await market.connect(userB).withdrawUnrevealed(marketId);

      const userBalanceAfter = await token.balanceOf(userB.address);
      const burnAfter = await token.balanceOf(burnAddress);

      expect(userBalanceAfter - userBalanceBefore).to.equal(ethers.parseEther("99"));
      expect(burnAfter - burnBefore).to.equal(ethers.parseEther("1"));

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

      await expect(market.connect(userA).revealBet(0, 1, 111)).to.be.revertedWith("Commit phase not active");
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
            const expected = (stake.amount * rewardPool) / winningPool;
            expect(payout).to.equal(expected);
          }
        }

        const totalPool = yesPool + noPool + unalignedPool;
        const accounted = payoutTotal + originatorFee;
        expect(accounted).to.be.at.most(totalPool);
        expect(totalPool - accounted).to.be.lessThanOrEqual(BigInt(Math.max(1, winners.length)));
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
});
