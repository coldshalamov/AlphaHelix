const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Close Fix", function () {
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

  it("Fix Verification: commitBet does NOT revert when it triggers market close", async function () {
    const { market, token, userA, userB } = await loadFixture(deployHelixMarketFixture);

    const minDuration = 3600;
    const avgDuration = 3601; // High probability of closing immediately after minDuration
    const revealDuration = 3600;

    await market.connect(userA).submitStatementWithRandomClose(
      "ipfs://test-close",
      minDuration,
      revealDuration,
      true,
      avgDuration
    );

    const marketId = 0;

    // Move past min duration
    await time.increase(minDuration + 1);

    // Try to commit until we trigger the close or hit a limit
    let closed = false;
    let closingUser = null;
    let balanceBefore = 0n;

    for (let i = 0; i < 50; i++) {
        // We need to change block variables to get different hashes
        await time.increase(1);

        const user = userB;
        const currentBalance = await token.balanceOf(user.address);

        // This should NOT revert even if it closes the market
        await market.connect(user).commitBet(
            marketId,
            buildCommit(1, i, user),
            ethers.parseEther("1")
        );

        const s = await market.markets(marketId);
        if (s.commitPhaseClosed > 0) {
            closed = true;
            closingUser = user;
            balanceBefore = currentBalance;
            break;
        }
    }

    expect(closed).to.be.true;

    // Verify market is CLOSED
    const s = await market.markets(marketId);
    expect(s.commitPhaseClosed).to.be.gt(0);

    // Verify the bet was NOT committed (user shouldn't be in hasCommitted because we returned early)
    // Wait, let's check hasCommitted
    const hasCommitted = await market.hasCommitted(marketId, closingUser.address);
    // Logic: if returned early, `hasCommitted` was not set.
    expect(hasCommitted).to.be.false;

    // Verify the user got the Ping Reward (1 HLX)
    // Balance should be: initial - 0 (no bet) + 1 (reward) = initial + 1
    const balanceAfter = await token.balanceOf(closingUser.address);
    const PING_REWARD = ethers.parseEther("1");

    expect(balanceAfter).to.equal(balanceBefore + PING_REWARD);
  });
});
