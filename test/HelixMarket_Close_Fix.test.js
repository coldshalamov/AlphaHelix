const { expect } = require("chai");
const { loadFixture, time, mine } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket DOS Fix Verification", function () {
  async function deployHelixMarketFixture() {
    const [owner, originator, user1, user2] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    // Grant MINTER_ROLE to owner
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);

    // Mint tokens
    await token.mint(originator.address, ethers.parseEther("1000"));
    await token.mint(user1.address, ethers.parseEther("1000"));
    await token.mint(user2.address, ethers.parseEther("1000"));

    // Approve tokens
    await token.connect(originator).approve(market.target, ethers.parseEther("1000"));
    await token.connect(user1).approve(market.target, ethers.parseEther("1000"));
    await token.connect(user2).approve(market.target, ethers.parseEther("1000"));

    return { token, market, owner, originator, user1, user2 };
  }

  it("should not revert when commitBet triggers random close", async function () {
    const { token, market, originator, user1, user2 } = await loadFixture(deployHelixMarketFixture);

    const minCommit = 3600; // 1 hour
    const revealDuration = 3600; // 1 hour
    const avgCommit = 7200; // 2 hours

    // Create random close market
    await market.connect(originator).submitStatementWithRandomClose(
      "test-cid",
      minCommit,
      revealDuration,
      true,
      avgCommit
    );

    const marketId = 0;

    // Fast forward to hardCommitEndTime so ANY interaction triggers the close
    await time.increase(avgCommit + 10);

    const amount = ethers.parseEther("10");
    const salt = 12345;
    const choice = 1; // YES
    const commitHash = ethers.keccak256(
      ethers.solidityPacked(
        ["uint8", "uint256", "address"],
        [choice, salt, user1.address]
      )
    );

    // Before the fix, this would revert with "Commit phase closed" because
    // checkRandomClose sets s.commitPhaseClosed to block.timestamp,
    // and commitBet requires s.commitPhaseClosed == 0.
    // With the fix, it should succeed.
    await market.connect(user1).commitBet(marketId, commitHash, amount);

    const marketStatus = await market.getRandomCloseStatus(marketId);
    expect(marketStatus.commitPhaseClosed).to.be.gt(0);
  });
});
