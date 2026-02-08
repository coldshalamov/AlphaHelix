const { expect } = require("chai");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Security: msg.sender Grinding", function () {
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

  it("PROTECTED: closeHash is consistent across msg.sender (No Grinding)", async function () {
    const { market, userA, userB, userC } = await loadFixture(
      deployHelixMarketFixture,
    );

    const minDuration = 3600;
    const revealDuration = 3600;
    const avgDuration = 7200;

    await market
      .connect(userA)
      .submitStatementWithRandomClose(
        "ipfs://grinding-test",
        minDuration,
        revealDuration,
        true,
        avgDuration,
      );

    const marketId = 0;

    // Advance time to allow random close
    await time.increase(minDuration + 1);

    // Get closeHash for userA
    const previewA = await market.connect(userA).previewCloseCheck(marketId);

    // Get closeHash for userB and userC in the SAME block
    const previewB = await market.connect(userB).previewCloseCheck(marketId);
    const previewC = await market.connect(userC).previewCloseCheck(marketId);

    console.log("Hash A:", previewA.closeHash);
    console.log("Hash B:", previewB.closeHash);
    console.log("Hash C:", previewC.closeHash);

    // If vulnerability is fixed, hashes should be EQUAL
    expect(previewA.closeHash).to.equal(previewB.closeHash);
    expect(previewB.closeHash).to.equal(previewC.closeHash);
  });
});
