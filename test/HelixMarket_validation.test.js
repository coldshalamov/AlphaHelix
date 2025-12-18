const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Security: Input Validation", function () {
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

  const biddingDuration = 3600;
  const revealDuration = 3600;

  it("should revert if CID is empty", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);
    await expect(
        market.connect(userA).submitStatement("", biddingDuration, revealDuration)
    ).to.be.revertedWith("CID empty");
  });

  it("should revert if CID is too long", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);
    const MAX_CID_LENGTH = 128;
    const longCid = "a".repeat(MAX_CID_LENGTH + 1);
    await expect(
        market.connect(userA).submitStatement(longCid, biddingDuration, revealDuration)
    ).to.be.revertedWith("CID too long");
  });

  it("should accept CID of max length", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);
    const MAX_CID_LENGTH = 128;
    const validCid = "a".repeat(MAX_CID_LENGTH);
    await expect(
        market.connect(userA).submitStatement(validCid, biddingDuration, revealDuration)
    ).to.not.be.reverted;
  });
});
