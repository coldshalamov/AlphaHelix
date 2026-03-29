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

  it("should revert when commitBet triggers random close (REPRODUCTION)", async function () {
    const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

    // Create a market where avgDuration == minDuration
    // This makes difficultyTarget = max_uint256, so it CLOSES ON FIRST INTERACTION after minDuration
    const minDuration = 3600;
    const revealDuration = 3600;
    const avgDuration = 3600; // Force immediate close

    await market.connect(userA).submitStatementWithRandomClose(
      "ipfs://force-close",
      minDuration,
      revealDuration,
      true,
      avgDuration
    );

    const marketId = 0;

    // Time travel past minDuration
    await time.increase(minDuration + 1);

    // Now call commitBet.
    // Logic:
    // 1. Modifier checkRandomClose runs.
    // 2. hash < target (always true because target is max).
    // 3. s.commitPhaseClosed = block.timestamp.
    // 4. Modifier finishes.
    // 5. Function body starts.
    // 6. require(s.commitPhaseClosed == 0, "Commit phase closed") -> FAILS

    // With the fix, this should NOT revert.
    // The bet should be accepted even if it triggers the close.
    await expect(
      market.connect(userB).commitBet(
        marketId,
        buildCommit(1, 123, userB),
        ethers.parseEther("10")
      )
    ).to.not.be.reverted;

    // Verify the bet was recorded
    const statement = await market.markets(marketId);
    expect(statement.commitPhaseClosed).to.be.gt(0); // Market should be closed

    // Check if the bet is in committedAmount
    const committed = await market.committedAmount(marketId, userB.address);
    expect(committed).to.equal(ethers.parseEther("10"));
  });
});
