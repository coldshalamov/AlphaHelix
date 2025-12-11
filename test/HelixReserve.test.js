const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixReserve", function () {
  async function deployHelixReserveFixture() {
    const [owner, user, other] = await ethers.getSigners();

    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();

    const HelixReserve = await ethers.getContractFactory("HelixReserve");
    const reserve = await HelixReserve.deploy(token.target);

    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, reserve.target);
    await token.grantRole(MINTER_ROLE, owner.address);

    return { token, reserve, owner, user, other, MINTER_ROLE };
  }

  it("Buy HLX", async function () {
    const { token, reserve, user } = await loadFixture(deployHelixReserveFixture);

    const oneEth = ethers.parseEther("1");
    const expectedHLX = ethers.parseEther("1000");

    const reserveBalanceBefore = await ethers.provider.getBalance(reserve.target);
    expect(reserveBalanceBefore).to.equal(0n);

    await reserve.connect(user).buy({ value: oneEth });

    const hlxBalance = await token.balanceOf(user.address);
    expect(hlxBalance).to.equal(expectedHLX);

    const reserveBalanceAfter = await ethers.provider.getBalance(reserve.target);
    expect(reserveBalanceAfter - reserveBalanceBefore).to.equal(oneEth);
  });

  it("Sell HLX", async function () {
    const { token, reserve, user } = await loadFixture(deployHelixReserveFixture);

    const oneEth = ethers.parseEther("1");
    await reserve.connect(user).buy({ value: oneEth });
    const hlxAmount = await token.balanceOf(user.address);

    await token.connect(user).approve(reserve.target, hlxAmount);

    const reserveBalanceBefore = await ethers.provider.getBalance(reserve.target);
    const userBalanceBefore = await ethers.provider.getBalance(user.address);

    const sellTx = await reserve.connect(user).sell(hlxAmount);
    const receipt = await sellTx.wait();
    const gasPrice = sellTx.gasPrice ?? sellTx.maxFeePerGas ?? receipt.effectiveGasPrice;
    const gasCost = gasPrice ? BigInt(receipt.gasUsed) * BigInt(gasPrice) : 0n;

    const userBalanceAfter = await ethers.provider.getBalance(user.address);
    const reserveBalanceAfter = await ethers.provider.getBalance(reserve.target);

    const ethAmount = BigInt(hlxAmount) / 1000n;
    expect(userBalanceAfter + gasCost).to.equal(userBalanceBefore + ethAmount);
    expect(reserveBalanceBefore - reserveBalanceAfter).to.equal(ethAmount);

    const reserveHLX = await token.balanceOf(reserve.target);
    expect(reserveHLX).to.equal(0n);
  });

  it("Sell with insufficient ETH in reserve", async function () {
    const { token, reserve, owner, user } = await loadFixture(deployHelixReserveFixture);

    const hlxAmount = ethers.parseEther("1000");
    await token.connect(owner).mint(user.address, hlxAmount);
    await token.connect(user).approve(reserve.target, hlxAmount);

    await expect(reserve.connect(user).sell(hlxAmount)).to.be.revertedWith(
      "Insufficient ETH in reserve"
    );
  });

  it("seedMarket uses HLX already in reserve", async function () {
    const { token, reserve, owner, other } = await loadFixture(deployHelixReserveFixture);

    const DummyMarketAMM = await ethers.getContractFactory("DummyMarketAMM");
    const dummyMarket = await DummyMarketAMM.deploy(token.target);

    const hlxAmount = ethers.parseEther("500");
    await token.connect(owner).mint(reserve.target, hlxAmount);

    const reserveBalanceBefore = await token.balanceOf(reserve.target);
    expect(reserveBalanceBefore).to.equal(hlxAmount);

    await reserve.seedMarket(dummyMarket.target, hlxAmount);

    const reserveBalanceAfter = await token.balanceOf(reserve.target);
    const dummyBalance = await token.balanceOf(dummyMarket.target);
    const mintedTotal = await dummyMarket.mintedTotal();
    const lastCaller = await dummyMarket.lastCaller();

    expect(reserveBalanceAfter).to.equal(0n);
    expect(dummyBalance).to.equal(hlxAmount);
    expect(mintedTotal).to.equal(hlxAmount);
    expect(lastCaller).to.equal(reserve.target);

    const buyer = other;
    const buyTx = await reserve.connect(buyer).buy({ value: ethers.parseEther("0.1") });
    await buyTx.wait();
    const buyerBalance = await token.balanceOf(buyer.address);
    expect(buyerBalance).to.equal(ethers.parseEther("100"));
  });
});
