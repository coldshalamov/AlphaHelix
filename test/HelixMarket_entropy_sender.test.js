const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelixMarket Randomness Sender Dependence", function () {
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

    // Mint tokens and approve
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, deployer.address);
    await token.mint(deployer.address, ethers.parseEther("1000"));

    // Fee is 100 HLX
    const STATEMENT_FEE = await market.STATEMENT_FEE();
    await token.approve(await market.getAddress(), STATEMENT_FEE);

    // Create a market with random close
    // minCommit = 3600, reveal = 3600, random = true, avg = 7200
    await market.submitStatementWithRandomClose(
      "ipfs://test",
      3600,
      3600,
      true,
      7200
    );
    marketId = 0;
  });

  it("should generate SAME hashes for different senders (Fix Verified)", async function () {
    // Advance time to allow random close check (minCommitDuration = 3600)
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine");

    // Check previewCloseCheck from user1
    const res1 = await market.connect(user1).previewCloseCheck.staticCall(marketId);

    // Check previewCloseCheck from user2
    const res2 = await market.connect(user2).previewCloseCheck.staticCall(marketId);

    console.log("Hash 1 (user1):", res1[0]);
    console.log("Hash 2 (user2):", res2[0]);

    // Fix: Hashes should be EQUAL because msg.sender is removed
    expect(res1[0]).to.equal(res2[0]);
  });
});
