const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Security - Max Duration", function () {
  async function deployHelixMarketFixture() {
    const [owner, userA] = await ethers.getSigners();
    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();
    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    // Give userA some tokens
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    const amount = ethers.parseEther("1000");
    await token.mint(userA.address, amount);
    await token.connect(userA).approve(market.target, amount);

    return { market, userA };
  }

  it("should fail to create a market with extremely long bidding duration", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);
    // 52 weeks is approx 31,449,600 seconds
    const maxDuration = await market.MAX_DURATION();
    const longBiddingDuration = maxDuration + 1n;
    const revealDuration = 3600;

    await expect(
        market.connect(userA).submitStatement("ipfs://long_bidding", longBiddingDuration, revealDuration)
    ).to.be.revertedWith("Bidding duration too long");
  });

  it("should fail to create a market with extremely long reveal duration", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);
    const maxDuration = await market.MAX_DURATION();
    const biddingDuration = 3600;
    const longRevealDuration = maxDuration + 1n;

    await expect(
        market.connect(userA).submitStatement("ipfs://long_reveal", biddingDuration, longRevealDuration)
    ).to.be.revertedWith("Reveal duration too long");
  });
});
