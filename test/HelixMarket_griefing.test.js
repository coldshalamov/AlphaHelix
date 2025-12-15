const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Security - Griefing", function () {
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

  it("should fail to create a market with extremely short reveal duration", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);
    const biddingDuration = 3600;
    const shortRevealDuration = 1; // 1 second reveal window is griefing

    // This should revert now that we have the fix.
    await expect(
        market.connect(userA).submitStatement("ipfs://grief", biddingDuration, shortRevealDuration)
    ).to.be.revertedWith("Reveal duration too short");
  });
});
