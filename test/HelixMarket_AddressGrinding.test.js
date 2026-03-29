const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Security: Address Grinding", function () {
  async function deployHelixMarketFixture() {
    const [owner, userA, userB] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    // Grant MINTER_ROLE to owner and mint some tokens
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);

    const amount = ethers.parseEther("1000");
    await token.mint(userA.address, amount);
    await token.mint(userB.address, amount);

    await token.connect(userA).approve(market.target, amount);
    await token.connect(userB).approve(market.target, amount);

    return { market, token, owner, userA, userB };
  }

  it("Reproduction: msg.sender currently influences closeHash (Address Grinding Risk)", async function () {
    const { market, userA, userB } = await loadFixture(deployHelixMarketFixture);

    // Create a market with random close enabled
    const minDuration = 3600;
    const revealDuration = 3600;
    const avgDuration = 7200;

    await market.connect(userA).submitStatementWithRandomClose(
      "ipfs://address-grinding-test",
      minDuration,
      revealDuration,
      true, // enable random close
      avgDuration
    );

    const marketId = 0;

    // Time travel to open the random close window
    await time.increase(minDuration + 1);

    // Check previewCloseCheck from userA
    const previewA = await market.connect(userA).previewCloseCheck(marketId);

    // Check previewCloseCheck from userB (in the same block ideally, but here simulated sequentially)
    // Since hardhat automines, this will be a new block.
    // To ensure same block properties, we can use `ethers.provider.send("evm_setAutomine", [false])`
    // OR we can observe that `checkRandomClose` uses `blockhash(block.number - 1)`.
    // If we are in block N, it uses hash of N-1.
    // If userA tx is in block N, userB tx is in block N+1.
    // UserA sees hash(N-1). UserB sees hash(N).
    // This makes direct comparison tricky if we just send transactions.

    // However, `previewCloseCheck` is a VIEW function.
    // View functions don't mine blocks.
    // So if we call them back-to-back, they should see the same block state (latest mined block).

    const previewB = await market.connect(userB).previewCloseCheck(marketId);

    console.log("UserA CloseHash:", previewA.closeHash);
    console.log("UserB CloseHash:", previewB.closeHash);

    // Assert that hashes are EQUAL (proving msg.sender is removed)
    expect(previewA.closeHash).to.equal(previewB.closeHash);
  });
});
