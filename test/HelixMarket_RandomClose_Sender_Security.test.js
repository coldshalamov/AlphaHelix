const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Random Close Security", function () {
  async function deployHelixMarketFixture() {
    const [owner, userA, userB] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    // Setup market
    const amount = ethers.parseEther("1000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(userA.address, amount);
    await token.mint(userB.address, amount);

    // Create a market with random close enabled
    const minDuration = 3600;
    const avgDuration = 7200;
    const revealDuration = 3600;

    await token.connect(userA).approve(market.target, amount);
    await market.connect(userA).submitStatementWithRandomClose(
      "ipfs://random-close-security",
      minDuration,
      revealDuration,
      true,
      avgDuration
    );

    return { market, token, owner, userA, userB };
  }

  it("should demonstrate that closeHash is INDEPENDENT of msg.sender (Prevents Address Grinding)", async function () {
    const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

    const marketId = 0;
    const minDuration = 3600;

    // Advance time to allow random close check
    await time.increase(minDuration + 1);

    // Check previewCloseCheck for userA and userB
    // Since it's a view function, it runs on the current state.
    // If msg.sender is included, hashes will differ.

    const previewA = await market.connect(userA).previewCloseCheck(marketId);
    const previewB = await market.connect(userB).previewCloseCheck(marketId);

    console.log("UserA Close Hash:", previewA.closeHash);
    console.log("UserB Close Hash:", previewB.closeHash);

    // Security Fix: Hashes should be EQUAL because msg.sender is NOT included
    expect(previewA.closeHash).to.equal(previewB.closeHash);
  });
});
