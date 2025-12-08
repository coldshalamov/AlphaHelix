const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, user1, user2] = await hre.ethers.getSigners();
  console.log("Seeding data with account:", deployer.address);

  // --- 1. Deploy Contracts ---

  // Deploy AlphaHelixToken
  const AlphaHelixToken = await hre.ethers.getContractFactory("AlphaHelixToken");
  const token = await AlphaHelixToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("AlphaHelixToken deployed to:", tokenAddress);

  // Deploy HelixReserve
  const HelixReserve = await hre.ethers.getContractFactory("HelixReserve");
  const reserve = await HelixReserve.deploy(tokenAddress);
  await reserve.waitForDeployment();
  const reserveAddress = await reserve.getAddress();
  console.log("HelixReserve deployed to:", reserveAddress);

  // Deploy HelixMarket
  const HelixMarket = await hre.ethers.getContractFactory("HelixMarket");
  const market = await HelixMarket.deploy(tokenAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("HelixMarket deployed to:", marketAddress);

  // Grant MINTER_ROLE to Reserve
  const MINTER_ROLE = await token.MINTER_ROLE();
  await (await token.grantRole(MINTER_ROLE, reserveAddress)).wait();
  console.log("Granted MINTER_ROLE to HelixReserve");

  // Grant MINTER_ROLE to Deployer (for easy seeding)
  await (await token.grantRole(MINTER_ROLE, deployer.address)).wait();
  console.log("Granted MINTER_ROLE to Deployer");

  // Write addresses to frontend config
  const configDir = path.join(__dirname, "../frontend/src/config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  const addresses = {
    AlphaHelixToken: tokenAddress,
    HelixReserve: reserveAddress,
    HelixMarket: marketAddress,
  };
  fs.writeFileSync(
    path.join(configDir, "contracts.json"),
    JSON.stringify(addresses, null, 2)
  );
  console.log("Addresses written to frontend/src/config/contracts.json");

  // --- 2. Mint HLX ---
  const users = [deployer, user1, user2];
  const mintAmount = hre.ethers.parseEther("10000"); // 10,000 HLX
  const approveAmount = hre.ethers.parseEther("1000000"); // Large approval

  for (const user of users) {
    await (await token.mint(user.address, mintAmount)).wait();
    console.log(`Minted 10,000 HLX to ${user.address}`);

    // Approve Market to spend tokens
    await (await token.connect(user).approve(marketAddress, approveAmount)).wait();
    console.log(`Approved HelixMarket for ${user.address}`);
  }

  // --- 3. Create Markets & Simulate Bets ---

  // Helper: Commit Bet
  // choice: 0=NO, 1=YES, 2=UNALIGNED
  async function commitBet(user, marketId, choice, salt, amountStr) {
    const amount = hre.ethers.parseEther(amountStr);
    const packed = hre.ethers.solidityPacked(
        ["uint8", "uint256", "address"],
        [choice, salt, user.address]
    );
    const hash = hre.ethers.keccak256(packed);
    await (await market.connect(user).commitBet(marketId, hash, amount)).wait();
    console.log(`User ${user.address} committed bet on Market ${marketId} (Choice: ${choice}, Amount: ${amountStr})`);
  }

  // Market 1: "Will ETH flip BTC in 2025?" (Phase: Open)
  // Long duration
  const oneYear = 365 * 24 * 60 * 60;
  await (await market.connect(deployer).submitStatement(
    "ipfs://QmMarket1_ETH_BTC_Flip_2025",
    oneYear,
    oneYear
  )).wait();
  console.log("Market 1 created: 'Will ETH flip BTC in 2025?' (Open)");

  // Market 2: "Is the sky blue?" (Phase: Commit)
  // Also long duration, but we will place bets.
  await (await market.connect(deployer).submitStatement(
    "ipfs://QmMarket2_Sky_Blue",
    oneYear,
    oneYear
  )).wait();
  console.log("Market 2 created: 'Is the sky blue?' (Commit)");

  // Bets for Market 2
  // User 1 bets YES (1)
  await commitBet(user1, 1, 1, 12345, "500");
  // User 2 bets NO (0)
  await commitBet(user2, 1, 0, 67890, "200");
  // Deployer bets UNALIGNED (2)
  await commitBet(deployer, 1, 2, 11111, "100");


  // Market 3: "Did we land on the moon?" (Phase: Reveal)
  // Short commit duration so we can travel past it.
  const shortDuration = 60; // 60 seconds
  const longReveal = oneYear;
  await (await market.connect(deployer).submitStatement(
    "ipfs://QmMarket3_Moon_Landing",
    shortDuration,
    longReveal
  )).wait();
  console.log("Market 3 created: 'Did we land on the moon?' (Reveal target)");

  // Bets for Market 3 (Must happen BEFORE time travel)
  // User 1 bets YES
  await commitBet(user1, 2, 1, 99999, "1000");
  // User 2 bets YES
  await commitBet(user2, 2, 1, 88888, "1000");

  // --- 4. Time Travel ---
  async function increaseTime(seconds) {
    await hre.network.provider.send("evm_increaseTime", [seconds]);
    await hre.network.provider.send("evm_mine");
    console.log(`Time traveled ${seconds} seconds`);
  }

  // Advance time to put Market 3 into Reveal phase
  // Market 3 commit duration is 60s. We go 100s.
  await increaseTime(100);
  console.log("Time advanced. Market 3 should now be in Reveal phase.");

  // Check phases
  const m1 = await market.markets(0);
  const m2 = await market.markets(1);
  const m3 = await market.markets(2);

  const now = (await hre.ethers.provider.getBlock('latest')).timestamp;

  console.log(`Current Time: ${now}`);
  console.log(`Market 1 Commit End: ${m1.commitEndTime} (Open? ${now < m1.commitEndTime})`);
  console.log(`Market 2 Commit End: ${m2.commitEndTime} (Open? ${now < m2.commitEndTime})`);
  console.log(`Market 3 Commit End: ${m3.commitEndTime} (Reveal? ${now >= m3.commitEndTime && now < m3.revealEndTime})`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
