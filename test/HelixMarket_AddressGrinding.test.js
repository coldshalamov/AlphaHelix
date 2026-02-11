const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Security", function () {
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
    // await token.approve(market.target, amount); // Owner approves - owner has no tokens
    await token.connect(userA).approve(market.target, amount);

    return { market, token, owner, userA, userB };
  }

  describe("Random Close Entropy", function () {
    it("should NOT depend on msg.sender (Address Grinding Protection)", async function () {
      const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

      // Create a random close market
      const minDuration = 3600;
      const revealDuration = 3600;
      const avgDuration = 7200;

      await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://test",
        minDuration,
        revealDuration,
        true,
        avgDuration
      );

      const marketId = 0;

      // Advance time to allow close checking
      await time.increase(minDuration + 1);

      // Mine a block so we have a fresh state
      await time.advanceBlock();

      const closeCheckA = await market.connect(userA).previewCloseCheck(marketId);
      const closeCheckB = await market.connect(userB).previewCloseCheck(marketId);

      // Check if hash depends on sender
      console.log("Close Hash A:", closeCheckA.closeHash);
      console.log("Close Hash B:", closeCheckB.closeHash);

      // Current expectation: they are different (fail secure check)
      // Fix expectation: they are same
      expect(closeCheckA.closeHash).to.equal(closeCheckB.closeHash, "Close hash should be independent of msg.sender");
    });
  });
});
