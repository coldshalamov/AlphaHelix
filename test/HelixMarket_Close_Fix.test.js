const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("HelixMarket Random Close Fix", function () {
  async function deployFixture() {
    const [owner, userA] = await ethers.getSigners();
    const AlphaHelixToken = await ethers.getContractFactory("AlphaHelixToken");
    const token = await AlphaHelixToken.deploy();
    const HelixMarket = await ethers.getContractFactory("HelixMarket");
    const market = await HelixMarket.deploy(token.target);

    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(userA.address, ethers.parseEther("1000"));
    await token.connect(userA).approve(market.target, ethers.parseEther("1000"));

    return { market, token, owner, userA };
  }

  it("reproduction: commitBet reverts when it triggers random close", async function () {
    const { market, userA } = await loadFixture(deployFixture);

    // minCommitDuration = 3600 (1 hour)
    // avgCommitDuration = 3601 (1 hour + 1 second)
    // avg - min = 1 second.
    // expectedInteractions = 1/60 = 0 -> 1.
    // difficultyTarget = max / 1 = max.
    // So ANY hash will be < difficultyTarget.
    // This guarantees a close on the first interaction after min duration.

    await market.connect(userA).submitStatementWithRandomClose(
        "ipfs://test",
        3600,
        3600,
        true,
        3601
    );
    const marketId = 0;

    // Move past min duration
    await time.increase(3601);

    const salt = 12345n;
    const choice = 1;
    const commitHash = ethers.solidityPackedKeccak256(
        ["uint8", "uint256", "address"],
        [choice, salt, userA.address]
    );

    // This commit should trigger the close.
    // After fix, it should NOT revert, but should return early (not committing the bet).
    await market.connect(userA).commitBet(marketId, commitHash, ethers.parseEther("10"));

    // Verify market is closed
    const statement = await market.markets(marketId);
    expect(statement.commitPhaseClosed).to.not.equal(0);

    // Verify bet was NOT committed (because market closed before processing)
    const hasCommitted = await market.hasCommitted(marketId, userA.address);
    expect(hasCommitted).to.be.false;
  });
});
