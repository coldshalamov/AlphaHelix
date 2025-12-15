const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Sentinel Security Checks", function () {
  async function deployHelixMarketFixture() {
    const [owner, userA, userB] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    const amount = ethers.parseEther("1000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(userA.address, amount);
    await token.mint(userB.address, amount);

    await token.connect(userA).approve(market.target, amount);
    await token.connect(userB).approve(market.target, amount);

    return { market, token, owner, userA, userB };
  }

  function buildCommit(choice, salt, user) {
    return ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choice, salt, user.address]);
  }

  it("Prevention: Cannot create market with short reveal duration", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);

    const biddingDuration = 3600;
    const revealDuration = 0; // The trap

    // Expect revert
    await expect(
      market.connect(userA).submitStatement("ipfs://grief", biddingDuration, revealDuration)
    ).to.be.revertedWith("Reveal duration too short");
  });

  it("Happy Path: Can create market with valid reveal duration", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);

    const biddingDuration = 3600;
    const revealDuration = 3600; // 1 hour (valid)

    await expect(
      market.connect(userA).submitStatement("ipfs://valid", biddingDuration, revealDuration)
    ).to.emit(market, "StatementCreated");
  });
});
