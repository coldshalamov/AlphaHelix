const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HelixMarket Security: Constructor Validation", function () {
  it("should revert if token address is zero", async function () {
    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    await expect(HelixMarket.deploy(ethers.ZeroAddress)).to.be.revertedWith("Invalid token");
  });
});
