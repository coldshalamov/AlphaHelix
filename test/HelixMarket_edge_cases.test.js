const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

require("@nomicfoundation/hardhat-chai-matchers");

describe("HelixMarket Edge Cases", function () {
  async function deployHelixMarketFixture() {
    const [owner, originator, userA, userB] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    const amount = ethers.parseEther("1000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(originator.address, amount);
    await token.mint(userA.address, amount);
    await token.mint(userB.address, amount);

    for (const user of [originator, userA, userB]) {
      await token.connect(user).approve(market.target, amount);
    }

    return { market, token, owner, originator, userA, userB };
  }

  const biddingDuration = 3600;
  const revealDuration = 3600;

  function buildCommit(choice, salt, user) {
    return ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choice, salt, user.address]);
  }

  it("reverts malformed reveal (wrong salt)", async function () {
    const { market, originator, userA } = await loadFixture(deployHelixMarketFixture);

    await market.connect(originator).submitStatement("ipfs://bad-salt", biddingDuration, revealDuration);
    const marketId = 0;

    const amount = ethers.parseEther("10");
    await market.connect(userA).commitBet(marketId, buildCommit(1, 111, userA), amount);

    await time.increase(biddingDuration + 1);

    await expect(market.connect(userA).revealBet(marketId, 1, 112)).to.be.revertedWith("Invalid hash/reveal");
    await expect(market.connect(userA).revealBet(marketId, 1, 111)).to.not.be.reverted;
  });

  it("reverts malformed reveal (invalid choice even if hash matches)", async function () {
    const { market, originator, userA } = await loadFixture(deployHelixMarketFixture);

    await market.connect(originator).submitStatement("ipfs://bad-choice", biddingDuration, revealDuration);
    const marketId = 0;

    const invalidChoice = 99;
    const salt = 4242;
    const amount = ethers.parseEther("1");
    await market.connect(userA).commitBet(marketId, buildCommit(invalidChoice, salt, userA), amount);

    await time.increase(biddingDuration + 1);

    await expect(market.connect(userA).revealBet(marketId, invalidChoice, salt)).to.be.revertedWith("Invalid choice");
  });

  it("reverts double-claim attempts", async function () {
    const { market, token, originator, userA, userB } = await loadFixture(deployHelixMarketFixture);

    await market.connect(originator).submitStatement("ipfs://double-claim", biddingDuration, revealDuration);
    const marketId = 0;

    const yesAmount = ethers.parseEther("10");
    const noAmount = ethers.parseEther("1");

    await market.connect(userA).commitBet(marketId, buildCommit(1, 777, userA), yesAmount);
    await market.connect(userB).commitBet(marketId, buildCommit(0, 888, userB), noAmount);

    await time.increase(biddingDuration + 1);
    await market.connect(userA).revealBet(marketId, 1, 777);
    await market.connect(userB).revealBet(marketId, 0, 888);

    await time.increase(revealDuration + 1);
    await market.resolve(marketId);

    const before = await token.balanceOf(userA.address);
    await market.connect(userA).claim(marketId);
    const after = await token.balanceOf(userA.address);
    expect(after).to.be.gt(before);

    await expect(market.connect(userA).claim(marketId)).to.be.revertedWith("No winning bet");
  });

  it("handles zero NO pool (YES wins with no opposition)", async function () {
    const { market, token, originator, userA } = await loadFixture(deployHelixMarketFixture);

    await market.connect(originator).submitStatement("ipfs://zero-no", biddingDuration, revealDuration);
    const marketId = 0;

    const yesAmount = ethers.parseEther("10");
    await market.connect(userA).commitBet(marketId, buildCommit(1, 1111, userA), yesAmount);

    await time.increase(biddingDuration + 1);
    await market.connect(userA).revealBet(marketId, 1, 1111);

    await time.increase(revealDuration + 1);

    const originatorBefore = await token.balanceOf(originator.address);
    await market.resolve(marketId);
    const originatorAfter = await token.balanceOf(originator.address);

    const expectedFee = ethers.parseEther("0.1");
    expect(originatorAfter - originatorBefore).to.equal(expectedFee);

    const userBefore = await token.balanceOf(userA.address);
    await market.connect(userA).claim(marketId);
    const userAfter = await token.balanceOf(userA.address);

    const expectedPayout = ethers.parseEther("9.9");
    expect(userAfter - userBefore).to.equal(expectedPayout);
  });
});

