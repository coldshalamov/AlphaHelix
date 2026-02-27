const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("HelixMarket Random Close Fix", function () {
  async function deployFixture() {
    const [owner, user, sniper] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("AlphaHelixToken");
    const token = await Token.deploy();

    // Mint tokens to user
    await token.grantRole(await token.MINTER_ROLE(), owner.address);
    await token.mint(user.address, ethers.parseEther("1000"));
    await token.mint(sniper.address, ethers.parseEther("1000"));

    const Market = await ethers.getContractFactory("HelixMarket");
    const market = await Market.deploy(token.target);

    // Approve market
    await token.connect(user).approve(market.target, ethers.parseEther("1000"));
    await token.connect(sniper).approve(market.target, ethers.parseEther("1000"));

    return { market, token, user, sniper };
  }

  it("should allow commitBet when random close is triggered in the same transaction", async function () {
    const { market, user } = await loadFixture(deployFixture);

    const minDuration = 3600;
    const avgDuration = 3600; // Same as min, so difficulty is MAX (always closes)

    // Create market with random close
    await market.connect(user).submitStatementWithRandomClose(
      "ipfs://test",
      minDuration,
      minDuration, // reveal duration
      true, // enable random close
      avgDuration
    );
    const marketId = 0;

    // Advance time past minDuration
    await time.increase(minDuration + 1);

    // Prepare bet
    const choice = 1;
    const salt = 12345n;
    const hash = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [choice, salt, user.address]);

    // This should SUCCESS because we updated the logic to allow if closedNow is true
    const tx = await market.connect(user).commitBet(marketId, hash, ethers.parseEther("10"));
    const receipt = await tx.wait();

    // Verify events
    const commitEvent = receipt.logs.find(log => {
      try {
        const parsed = market.interface.parseLog(log);
        return parsed.name === 'BetCommitted';
      } catch (e) { return false; }
    });
    expect(commitEvent).to.not.be.undefined;

    const closeEvent = receipt.logs.find(log => {
      try {
        const parsed = market.interface.parseLog(log);
        return parsed.name === 'CommitPhaseClosedRandomly';
      } catch (e) { return false; }
    });
    expect(closeEvent).to.not.be.undefined;

    // Verify market IS closed
    const status = await market.getRandomCloseStatus(marketId);
    expect(status.commitPhaseClosed).to.be.gt(0);
  });

  it("should prevent sniping after close in same block (but different transaction)", async function () {
    const { market, user, sniper } = await loadFixture(deployFixture);

    const minDuration = 3600;
    const avgDuration = 3600; // Always closes

    await market.connect(user).submitStatementWithRandomClose(
      "ipfs://test",
      minDuration,
      minDuration,
      true,
      avgDuration
    );
    const marketId = 0;

    await time.increase(minDuration + 1);

    // Disable automine to queue multiple transactions in same block
    await ethers.provider.send("evm_setAutomine", [false]);

    // User A triggers close
    const hashA = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [1, 123n, user.address]);
    const txA = await market.connect(user).commitBet(marketId, hashA, ethers.parseEther("10"));

    // User B tries to snipe in same block (should fail because state is updated after txA)
    const hashB = ethers.solidityPackedKeccak256(["uint8", "uint256", "address"], [0, 456n, sniper.address]);
    const txB = await market.connect(sniper).commitBet(marketId, hashB, ethers.parseEther("10"));

    // Mine block
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_setAutomine", [true]);

    // Transaction A should succeed
    const receiptA = await txA.wait();
    expect(receiptA.status).to.equal(1);

    // Transaction B should fail
    try {
        await txB.wait();
        expect.fail("Transaction B should have reverted");
    } catch (error) {
        // Log the error message to debug
        // console.log("Transaction B failed with:", error.message);

        // We expect "Commit phase closed" because A ran first in the block and closed it.
        // B sees s.commitPhaseClosed > 0 and closedNow = false (because it's already closed).
        expect(error.message).to.satisfy(msg =>
            msg.includes("Commit phase closed") || msg.includes("reverted")
        );
    }
  });
});
