const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelixMarket Randomness Grinding", function () {
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

    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, deployer.address);
    await token.mint(deployer.address, ethers.parseEther("1000"));

    const STATEMENT_FEE = await market.STATEMENT_FEE();
    await token.approve(await market.getAddress(), STATEMENT_FEE);

    await market.submitStatementWithRandomClose(
      "ipfs://test",
      3600,
      3600,
      true,
      7200
    );
    marketId = 0;
  });

  it("should generate SAME hashes for different senders (prevent grinding)", async function () {
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);

    const res1 = await market.connect(user1).previewCloseCheck.staticCall(marketId);

    // Simulate mining another block but ensuring previous inputs are same for next sender
    // However, the test itself ensures `user2` vs `user1` doesn't affect hash when we do a static call
    // at the same exact block.
    // So if the fix is correct, `msg.sender` being different should not change the closeHash
    const res2 = await market.connect(user2).previewCloseCheck.staticCall(marketId);

    expect(res1[0]).to.equal(res2[0]);
  });
});
