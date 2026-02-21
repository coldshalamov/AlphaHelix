const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelixMarket Random Close Fix", function () {
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

  it("should CLOSE market and NOT REVERT when commitBet triggers random close", async function () {
    // Create market with very low difficulty (easy to close)
    // avgCommitDuration = minCommitDuration -> target ~MAX_UINT -> always closes
    const minCommit = 3600;
    const reveal = 3600;
    const avgCommit = 3600;

    await market.submitStatementWithRandomClose("test", minCommit, reveal, true, avgCommit);
    const marketId = 0;

    // Advance time past minCommit
    await ethers.provider.send("evm_increaseTime", [minCommit + 1]);
    await ethers.provider.send("evm_mine");

    const betAmount = ethers.parseEther("10");
    const commitHash = ethers.keccak256(ethers.toUtf8Bytes("test"));

    // This should close the market.
    // Before fix: Reverted with "Commit phase closed".
    // After fix: Should succeed (tx mined), close market, but NOT place bet.

    const tx = await market.commitBet(marketId, commitHash, betAmount);
    await tx.wait();

    // Verify Market Closed Event emitted (indirectly by checking state)

    const status = await market.getRandomCloseStatus(marketId);
    expect(status[1]).to.be.gt(0n); // commitPhaseClosed > 0

    // Verify bet was NOT placed
    // hasCommitted should be false
    const hasCommitted = await market.hasCommitted(marketId, deployer.address);
    expect(hasCommitted).to.equal(false);

    // committedAmount should be 0
    const committed = await market.committedAmount(marketId, deployer.address);
    expect(committed).to.equal(0n);
  });
});
