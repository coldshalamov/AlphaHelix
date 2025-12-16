const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Security: Griefing Prevention", function () {
  async function deployHelixMarketFixture() {
    const [owner, userA] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    // Setup fees
    const amount = ethers.parseEther("1000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(userA.address, amount);
    await token.connect(userA).approve(market.target, amount);

    return { market, token, userA };
  }

  const ONE_HOUR = 3600;

  it("PROTECTION: Should prevent creating a market with reveal duration < 1 hour", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);

    const biddingDuration = 60;
    const shortRevealDuration = 60; // 1 minute (Too short!)

    // This should revert because 60 < 3600
    await expect(
      market.connect(userA).submitStatement("ipfs://grief", biddingDuration, shortRevealDuration)
    ).to.be.revertedWith("Reveal duration too short");
  });

  it("PROTECTION: Should allow creating a market with reveal duration >= 1 hour", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);

    const biddingDuration = 60;
    const validRevealDuration = ONE_HOUR;

    // This should succeed
    await expect(
      market.connect(userA).submitStatement("ipfs://valid", biddingDuration, validRevealDuration)
    ).to.emit(market, "StatementCreated");
  });
});
