const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("AlphaHelixToken Security - Safe Burn", function () {
  async function deployTokenFixture() {
    const [owner, minter, attacker, victim] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.grantRole(MINTER_ROLE, minter.address);

    // Mint some tokens to victim
    await token.mint(victim.address, ethers.parseEther("1000"));

    return { token, owner, minter, attacker, victim, MINTER_ROLE };
  }

  it("SAFE: MINTER_ROLE CANNOT burn arbitrary user tokens without allowance", async function () {
    const { token, minter, victim } = await loadFixture(deployTokenFixture);

    const amount = ethers.parseEther("100");

    // Attempting to call burnFrom without allowance should fail
    // ERC20Burnable uses burnFrom(account, amount) which checks allowance
    await expect(
      token.connect(minter).burnFrom(victim.address, amount)
    ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
  });

  it("SAFE: MINTER_ROLE CAN burn user tokens WITH allowance", async function () {
    const { token, minter, victim } = await loadFixture(deployTokenFixture);

    const amount = ethers.parseEther("100");
    await token.connect(victim).approve(minter.address, amount);

    const victimBalanceBefore = await token.balanceOf(victim.address);

    await token.connect(minter).burnFrom(victim.address, amount);

    const victimBalanceAfter = await token.balanceOf(victim.address);
    expect(victimBalanceBefore - victimBalanceAfter).to.equal(amount);
  });

  it("SAFE: User can burn their own tokens", async function () {
    const { token, victim } = await loadFixture(deployTokenFixture);

    const amount = ethers.parseEther("50");
    const balanceBefore = await token.balanceOf(victim.address);

    await token.connect(victim).burn(amount);

    const balanceAfter = await token.balanceOf(victim.address);
    expect(balanceBefore - balanceAfter).to.equal(amount);
  });
});
