const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Repro", function () {
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

  it("REPRO: commitBet does NOT revert when triggering random close, allowing market to close", async function () {
    const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

    // Create market with extremely high probability of closing immediately after minDuration
    // avgDuration = minDuration implies expected interactions = 0 -> difficulty = max
    // So it SHOULD close on the first interaction after minDuration.
    const minDuration = 3600;
    const avgDuration = 3600; // implies immediate close

    await market.connect(userA).submitStatementWithRandomClose(
      "ipfs://repro",
      minDuration,
      3600,
      true,
      avgDuration
    );

    const marketId = 0;

    // Time travel past minDuration
    await time.increase(minDuration + 1);

    // Now userB tries to commit.
    // This interaction triggers checkRandomClose.
    // Since difficulty is max, it SHOULD close.
    // With the FIX, this should NOT revert. It should return early.
    // The bet should NOT be recorded.

    const amount = ethers.parseEther("10");
    const commitHash = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [1, 123, userB.address]);

    await expect(
      market.connect(userB).commitBet(marketId, commitHash, amount)
    ).to.not.be.reverted;

    // Verify market is CLOSED
    const statement = await market.markets(marketId);
    expect(statement.commitPhaseClosed).to.be.gt(0); // Market MUST be closed

    // Verify bet was NOT recorded
    const hasCommitted = await market.hasCommitted(marketId, userB.address);
    expect(hasCommitted).to.be.false;

    // Verify funds were NOT transferred (except maybe gas)
    const committedAmount = await market.committedAmount(marketId, userB.address);
    expect(committedAmount).to.equal(0);

    console.log("Market successfully closed via commitBet trigger!");
  });
});
