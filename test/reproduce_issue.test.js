const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reproduction: commitBet reverts on close", function () {
  let token, market;
  let deployer;

  beforeEach(async function () {
    [deployer] = await ethers.getSigners();
    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    token = await AlphaHelixToken.deploy();
    await token.waitForDeployment();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    market = await HelixMarket.deploy(await token.getAddress());
    await market.waitForDeployment();

    // Setup
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, deployer.address);
    await token.mint(deployer.address, ethers.parseEther("10000"));
    await token.approve(await market.getAddress(), ethers.MaxUint256);
  });

  it("should fail to close market via commitBet when condition met", async function () {
    // Create market with very low difficulty (easy to close)
    // avgCommitDuration same as minCommitDuration -> target ~MAX_UINT -> always closes
    const minCommit = 3600;
    const reveal = 3600;
    const avgCommit = 3600; // implies easy target

    await market.submitStatementWithRandomClose("test", minCommit, reveal, true, avgCommit);
    const marketId = 0;

    // Advance time past minCommit
    await ethers.provider.send("evm_increaseTime", [minCommit + 1]);
    await ethers.provider.send("evm_mine");

    const betAmount = ethers.parseEther("10");
    const commitHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

    // This should close the market because target is huge (avg - min = 0 => difficulty = max)
    // Actually if avg == min, difficulty calculation:
    // avgDuration - minCommitDuration = 0.
    // _calculateDifficultyTarget(0) -> expectedInteractions = 0/60 = 0 -> set to 1.
    // difficulty = MAX / 1 = MAX.
    // So ANY hash < MAX will close.

    // Expect revert because checkRandomClose closes it, then require(commitPhaseClosed == 0) fails
    await expect(
      market.commitBet(marketId, commitHash, betAmount)
    ).to.be.revertedWith("Commit phase closed");

    // Verify market is NOT closed (state reverted)
    const status = await market.getRandomCloseStatus(marketId);
    expect(status[1]).to.equal(0n); // commitPhaseClosed == 0
  });
});
