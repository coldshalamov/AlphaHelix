const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelixMarket Grinding Vulnerability", function () {
  let token, market;
  let deployer, user1, user2;
  let marketId;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    token = await AlphaHelixToken.deploy();
    await token.waitForDeployment();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    market = await HelixMarket.deploy(await token.getAddress());
    await market.waitForDeployment();

    // Mint tokens to deployer for fee
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, deployer.address);
    await token.mint(deployer.address, ethers.parseEther("1000"));

    // Approve fee
    const STATEMENT_FEE = await market.STATEMENT_FEE();
    await token.approve(await market.getAddress(), STATEMENT_FEE);

    // Create a market with random close
    await market.submitStatementWithRandomClose(
      "ipfs://test",
      3600, // minCommitDuration
      3600, // revealDuration
      true, // enableRandomClose
      7200  // avgCommitDuration
    );
    marketId = 0;
  });

  it("should confirm that msg.sender DOES NOT affect closeHash (Fix Verified)", async function () {
    // Advance time past minCommitDuration to enable random close check
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");

    // Check with user1
    const res1 = await market.connect(user1).previewCloseCheck.staticCall(marketId);
    // Check with user2
    const res2 = await market.connect(user2).previewCloseCheck.staticCall(marketId);

    console.log("Hash 1 (user1):", res1[0]);
    console.log("Hash 2 (user2):", res2[0]);

    // Expected behavior: Hashes should be EQUAL regardless of sender.
    expect(res1[0]).to.equal(res2[0]);
  });
});
