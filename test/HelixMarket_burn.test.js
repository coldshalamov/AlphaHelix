const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Token Burn", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();
    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();
    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);

    return { market, token, owner, user };
  }

  const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";
  const STATEMENT_FEE = ethers.parseEther("100");

  it("VERIFICATION: Tokens are correctly burned from total supply", async function () {
    const { market, token, user, owner } = await loadFixture(deployFixture);

    // Mint tokens to user
    const initialSupply = ethers.parseEther("1000");
    await token.mint(user.address, initialSupply);
    await token.connect(user).approve(market.target, initialSupply);

    const startSupply = await token.totalSupply();
    expect(startSupply).to.equal(initialSupply);

    // 1. Create Market (Burning STATEMENT_FEE)
    await market.connect(user).submitStatement("ipfs://test", 3600, 3600);

    const supplyAfterCreation = await token.totalSupply();
    const deadBalance = await token.balanceOf(BURN_ADDRESS);

    // New behavior: Supply decreased by STATEMENT_FEE, dEaD has 0 balance
    expect(supplyAfterCreation).to.equal(initialSupply - STATEMENT_FEE);
    expect(deadBalance).to.equal(0);

    console.log("Verified: Supply decreased after market creation.");
    console.log(`Total Supply: ${ethers.formatEther(supplyAfterCreation)} HLX`);

    // 2. Commit and Withdraw Unrevealed (Burning Penalty)
    const marketId = 0;
    const betAmount = ethers.parseEther("50");
    const commitHash = ethers.solidityPackedKeccak256(
      ["uint8", "uint256", "address"],
      [1, 123, user.address]
    );

    await market.connect(user).commitBet(marketId, commitHash, betAmount);

    // Wait for reveal phase to end
    await time.increase(3600 + 3600 + 1);

    // Withdraw unrevealed (100% penalty)
    await market.connect(user).withdrawUnrevealed(marketId);

    const supplyAfterPenalty = await token.totalSupply();
    const deadBalance2 = await token.balanceOf(BURN_ADDRESS);

    // New behavior: Supply decreased further by betAmount, dEaD still 0
    expect(supplyAfterPenalty).to.equal(initialSupply - STATEMENT_FEE - betAmount);
    expect(deadBalance2).to.equal(0);

    console.log("Verified: Supply decreased after penalty.");
    console.log(`Total Supply: ${ethers.formatEther(supplyAfterPenalty)} HLX`);
  });
});
