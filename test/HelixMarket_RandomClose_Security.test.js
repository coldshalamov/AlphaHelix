const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelixMarket Security Fix Verification", function () {
  let token, market;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("AlphaHelixToken");
    token = await Token.deploy();

    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(owner.address, ethers.parseEther("10000"));
    await token.mint(user1.address, ethers.parseEther("10000"));
    await token.mint(user2.address, ethers.parseEther("10000"));

    const Market = await ethers.getContractFactory("HelixMarket");
    market = await Market.deploy(await token.getAddress());

    await token.connect(owner).approve(await market.getAddress(), ethers.MaxUint256);
    await token.connect(user1).approve(await market.getAddress(), ethers.MaxUint256);
    await token.connect(user2).approve(await market.getAddress(), ethers.MaxUint256);
  });

  it("Should allow commitBet to succeed even when it triggers market close", async function () {
    const minCommitDuration = 3600;
    const revealDuration = 3600;
    // Low avg duration means high difficulty (easy to close)
    const avgCommitDuration = 3600 + 60;

    await market.connect(owner).submitStatementWithRandomClose(
      "QmHash",
      minCommitDuration,
      revealDuration,
      true,
      avgCommitDuration
    );
    const marketId = 0;

    // Fast forward
    await ethers.provider.send("evm_increaseTime", [minCommitDuration + 1]);
    await ethers.provider.send("evm_mine");

    const commitHash = ethers.keccak256(ethers.toUtf8Bytes("commit"));
    const amount = ethers.parseEther("10");

    // Before commit: Market open
    const statusBefore = await market.getRandomCloseStatus(marketId);
    expect(statusBefore[1]).to.equal(0);

    // User 1 commits. This should trigger close AND succeed.
    await expect(
      market.connect(user1).commitBet(marketId, commitHash, amount)
    ).to.emit(market, "CommitPhaseClosedRandomly")
     .and.to.emit(market, "BetCommitted");

    // Verify market is now closed
    const statusAfter = await market.getRandomCloseStatus(marketId);
    expect(statusAfter[1]).to.be.gt(0);

    // Verify bet was accepted
    const hasCommitted = await market.hasCommitted(marketId, user1.address);
    expect(hasCommitted).to.be.true;
  });

  it("Should show that closeHash is independent of msg.sender (No Address Grinding)", async function () {
    const minCommitDuration = 3600;
    const revealDuration = 3600;
    const avgCommitDuration = 3600 + 3600;

    await market.connect(owner).submitStatementWithRandomClose(
      "QmHash2",
      minCommitDuration,
      revealDuration,
      true,
      avgCommitDuration
    );
    const marketId = 0;

    await ethers.provider.send("evm_increaseTime", [minCommitDuration + 1]);
    await ethers.provider.send("evm_mine");

    const check1 = await market.connect(user1).previewCloseCheck(marketId);
    const check2 = await market.connect(user2).previewCloseCheck(marketId);

    // Hashes should now be IDENTICAL because msg.sender is removed
    expect(check1.closeHash).to.equal(check2.closeHash);
    expect(check1.willClose).to.equal(check2.willClose);
  });
});
