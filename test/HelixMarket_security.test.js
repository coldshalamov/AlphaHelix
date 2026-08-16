const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

require("@nomicfoundation/hardhat-chai-matchers");

describe("HelixMarket Security: Overwrite Commitment", function () {
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
    await token.mint(owner.address, amount);

    await token.connect(userA).approve(market.target, amount);
    await token.connect(userB).approve(market.target, amount);

    return { market, token, owner, userA, userB };
  }

  const biddingDuration = 3600;
  const revealDuration = 3600;

  function buildCommit(choice, salt, user) {
    return ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choice, salt, user.address]);
  }

  it("PROTECTION: Prevents overwriting commitment", async function () {
    const { market, userA } = await loadFixture(deployHelixMarketFixture);

    await market.connect(userA).submitStatement("ipfs://overwrite", biddingDuration, revealDuration);
    const marketId = 0;

    // 1. Commit 100 HLX on YES
    const amount1 = ethers.parseEther("100");
    const salt1 = 123;
    const commit1 = buildCommit(1, salt1, userA); // Choice 1 = YES
    await market.connect(userA).commitBet(marketId, commit1, amount1);

    // 2. Try to commit 1 Wei on NO
    const amount2 = 1n; // 1 wei
    const salt2 = 456;
    const commit2 = buildCommit(0, salt2, userA); // Choice 0 = NO

    // Expect revert
    await expect(market.connect(userA).commitBet(marketId, commit2, amount2))
        .to.be.revertedWith("Already committed");

    // 3. Move to reveal phase
    await time.increase(biddingDuration + 1);

    // 4. Reveal the FIRST commitment (YES) - Should still work
    await expect(market.connect(userA).revealBet(marketId, 1, salt1))
      .to.emit(market, "BetRevealed")
      .withArgs(marketId, userA.address, 1, amount1);

    // Verify pool state
    const statement = await market.markets(marketId);
    expect(statement.yesPool).to.equal(amount1);
    expect(statement.noPool).to.equal(0);

    console.log("Protection verified: User could not overwrite commitment.");
  });
});

describe("HelixMarket Security: Logic DoS on Random Close", function () {
  it("PROTECTION: Prevents commitBet from reverting when it triggers random close", async function () {
    const [owner, userA] = await ethers.getSigners();
    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    const amount = ethers.parseEther("1000");
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(owner.address, amount);
    await token.approve(market.target, amount);

    await token.mint(userA.address, amount);
    await token.connect(userA).approve(market.target, amount);

    await market.submitStatementWithRandomClose("ipfs://dos", 3600, 3600, true, 7200);
    const marketId = 0;

    await ethers.provider.send("evm_increaseTime", [3601]);
    await ethers.provider.send("evm_mine");

    let willClose = false;
    let attempts = 0;
    while (!willClose && attempts < 1000) {
      const res = await market.connect(userA).previewCloseCheck(marketId);
      willClose = res.willClose;
      if (!willClose) {
        await ethers.provider.send("evm_mine");
        attempts++;
      }
    }

    expect(willClose).to.be.true;

    // We expect the tx to NOT revert if the issue is fixed.
    const salt = 123;
    const commitHashValue = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [1, salt, userA.address]);

    await expect(market.connect(userA).commitBet(marketId, commitHashValue, ethers.parseEther("10")))
      .to.not.be.reverted;
  });
});
