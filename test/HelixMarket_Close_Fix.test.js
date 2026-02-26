const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Close Fix", function () {
  async function deployFixture() {
    const [owner, userA] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("AlphaHelixToken");
    const token = await Token.deploy();
    const Market = await ethers.getContractFactory("HelixMarket");
    const market = await Market.deploy(token.target);

    // Mint tokens
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(owner.address, ethers.parseEther("10000"));
    await token.mint(userA.address, ethers.parseEther("10000"));

    await token.connect(owner).approve(market.target, ethers.parseEther("10000"));
    await token.connect(userA).approve(market.target, ethers.parseEther("10000"));

    return { market, token, owner, userA };
  }

  it("VERIFICATION: commitBet should NOT revert when triggering random close, and market SHOULD close", async function () {
    const { market, owner, userA, token } = await loadFixture(deployFixture);

    const minDuration = 3600;
    const avgDuration = 3601; // High probability to close

    await market.connect(owner).submitStatementWithRandomClose(
      "ipfs://test",
      minDuration,
      3600,
      true,
      avgDuration
    );

    const marketId = 0;

    // Advance time to allow close
    await time.increase(minDuration + 1);

    let triggered = false;
    let closed = false;

    // Try multiple times to ensure we hit the random condition or timeout
    for (let i = 0; i < 50; i++) {
        // This should NOT revert now. It should either:
        // 1. Succeed and place bet (if random close NOT triggered)
        // 2. Succeed and NOT place bet but CLOSE market (if random close TRIGGERED)

        // We can check if it closed by checking commitPhaseClosed after call
        await market.connect(userA).commitBet(
            marketId,
            ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [1, i, userA.address]),
            ethers.parseEther("10")
        );

        const status = await market.getRandomCloseStatus(marketId);
        if (status.commitPhaseClosed > 0) {
            console.log("Market closed at attempt", i);
            closed = true;
            triggered = true;
            break;
        }

        await time.increase(1);
    }

    if (!closed) {
        console.log("Random close missed in 50 attempts, forcing via time limit");
        await time.increase(avgDuration);

        // This call should definitely trigger close due to hardCommitEndTime
        await market.connect(userA).commitBet(
            marketId,
            ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [1, 999, userA.address]),
            ethers.parseEther("10")
        );

        const status = await market.getRandomCloseStatus(marketId);
        if (status.commitPhaseClosed > 0) {
            console.log("Market closed via hard limit");
            closed = true;
        }
    }

    expect(closed).to.be.true;

    const status = await market.getRandomCloseStatus(marketId);
    expect(status.commitPhaseClosed).to.be.gt(0);
  });
});
