const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("HelixMarket Security: Random Close DOS Fix", function () {
    let token, market;
    let owner, user1;

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("AlphaHelixToken");
        token = await Token.deploy();

        const Market = await ethers.getContractFactory("HelixMarket");
        market = await Market.deploy(await token.getAddress());

        const MINTER_ROLE = await token.MINTER_ROLE();
        await token.grantRole(MINTER_ROLE, owner.address);

        await token.mint(owner.address, ethers.parseEther("1000"));
        await token.mint(user1.address, ethers.parseEther("1000"));

        await token.approve(await market.getAddress(), ethers.MaxUint256);
        await token.connect(user1).approve(await market.getAddress(), ethers.MaxUint256);
    });

    it("should allow commitBet to succeed even if checkRandomClose triggers a close in the same block", async function () {
        // Create market with minCommitDuration = avgCommitDuration = 1 hour
        // This ensures difficulty target is very low (easiest to close)
        // AND hardCommitEndTime = minCommitTime, guaranteeing a close on the next interaction after 1 hour.
        await market.submitStatementWithRandomClose(
            "QmT",
            3600, // minCommitDuration
            3600, // revealDuration
            true, // enableRandomClose
            3600  // avgCommitDuration
        );

        const marketId = 0;

        // Fast forward 1 hour to pass the commitEndTime
        await network.provider.send("evm_increaseTime", [3601]);
        await network.provider.send("evm_mine");

        const commitHash = ethers.keccak256(ethers.solidityPacked(
            ['uint8', 'uint256', 'address'],
            [1, 12345, user1.address]
        ));

        // When user1 commits, checkRandomClose will trigger and set s.commitPhaseClosed to block.timestamp.
        // Before the DOS fix, the require(s.commitPhaseClosed == 0) in commitBet would revert the transaction.
        // With the DOS fix, it should succeed.
        await expect(market.connect(user1).commitBet(marketId, commitHash, ethers.parseEther("10")))
            .to.not.be.reverted;

        // Verify the market actually closed
        const status = await market.getRandomCloseStatus(marketId);
        expect(status.commitPhaseClosed).to.be.gt(0);
    });
});
