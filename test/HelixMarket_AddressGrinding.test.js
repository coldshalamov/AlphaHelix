const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("HelixMarket Address Grinding Vulnerability", function () {
  let token, market;
  let owner, userA, userB;
  let marketId;

  beforeEach(async function () {
    [owner, userA, userB] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    token = await AlphaHelixToken.deploy();
    await token.waitForDeployment();

    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    market = await HelixMarket.deploy(await token.getAddress());
    await market.waitForDeployment();

    // Mint tokens and approve
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(owner.address, ethers.parseEther("1000"));

    const STATEMENT_FEE = await market.STATEMENT_FEE();
    await token.approve(await market.getAddress(), STATEMENT_FEE);

    // Create a market with random close
    await market.submitStatementWithRandomClose(
      "ipfs://test",
      3600, // minCommit
      3600, // reveal
      true, // random
      7200  // avg
    );
    marketId = 0;
  });

  it("demonstrates that msg.sender DOES NOT affect closeHash (Grinding prevented)", async function () {
    // Advance time to allow random close check
    await time.increase(3601);

    // Check previewCloseCheck with userA
    const resA = await market.connect(userA).previewCloseCheck.staticCall(marketId);

    // Check previewCloseCheck with userB
    const resB = await market.connect(userB).previewCloseCheck.staticCall(marketId);

    console.log("Hash A (User A):", resA[0]);
    console.log("Hash B (User B):", resB[0]);

    // Vulnerability Fixed: Hashes are identical, preventing grinding
    expect(resA[0]).to.equal(resB[0]);
  });
});
