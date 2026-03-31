const { ethers, network } = require("hardhat");

async function main() {
    console.log("Deploying Token...");
    const Token = await ethers.getContractFactory("AlphaHelixToken");
    const token = await Token.deploy();
    await token.waitForDeployment();
    const tokenAddr = await token.getAddress();

    console.log("Deploying HelixMarket...");
    const Market = await ethers.getContractFactory("HelixMarket");
    const market = await Market.deploy(tokenAddr);
    await market.waitForDeployment();
    const marketAddr = await market.getAddress();

    const [owner, user] = await ethers.getSigners();

    // Grant minter role
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, owner.address);
    await token.mint(owner.address, ethers.parseEther("1000"));
    await token.mint(user.address, ethers.parseEther("1000"));

    await token.approve(marketAddr, ethers.parseEther("1000"));
    await token.connect(user).approve(marketAddr, ethers.parseEther("1000"));

    console.log("Creating market...");
    // 1 hour min commit, 1 hour avg commit -> difficulty = max/1 = max (will close on FIRST ping after minCommit)
    await market.submitStatementWithRandomClose(
        "QmT",
        3600, // min commit: 1 hour
        3600, // reveal: 1 hour
        true,
        3600  // avg commit: 1 hour (forces instant close after min duration)
    );

    const marketId = 0;

    console.log("Fast forwarding time by 1 hour...");
    await network.provider.send("evm_increaseTime", [3601]);
    await network.provider.send("evm_mine");

    console.log("Attempting to commitBet. This should trigger random close, and then revert due to commitPhaseClosed > 0");

    const commitHash = ethers.keccak256(ethers.solidityPacked(
        ['uint8', 'uint256', 'address'],
        [1, 12345, user.address]
    ));

    try {
        await market.connect(user).commitBet(marketId, commitHash, ethers.parseEther("10"));
        console.log("commitBet succeeded! (Vulnerability not present?)");
    } catch (e) {
        console.error("commitBet REVERTED! Vulnerability confirmed:", e.message);
    }
}

main().catch(console.error);