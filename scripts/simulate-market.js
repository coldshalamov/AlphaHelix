/**
 * Market Simulation Script
 *
 * Creates and simulates a full market lifecycle for testing the frontend
 *
 * Usage:
 *   node scripts/simulate-market.js [--network localhost]
 */

const hre = require("hardhat");

async function main() {
  console.log("🎲 Starting market simulation...\n");

  const [deployer, originator, userA, userB, userC] = await hre.ethers.getSigners();

  // Get deployed contracts
  const configPath = "./frontend/src/config/contracts.json";
  let config;
  try {
    config = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error("❌ No deployed contracts found. Run deployment first.");
    process.exit(1);
  }

  const market = await hre.ethers.getContractAt("HelixMarket", config.HelixMarket);
  const token = await hre.ethers.getContractAt("AlphaHelixToken", config.AlphaHelixToken);
  const reserve = await hre.ethers.getContractAt("HelixReserve", config.HelixReserve);

  console.log("📄 Using contracts:");
  console.log("  HelixMarket:", config.HelixMarket);
  console.log("  AlphaHelixToken:", config.AlphaHelixToken);
  console.log("  HelixReserve:", config.HelixReserve);
  console.log("");

  // Grant minter role to reserve
  const MINTER_ROLE = await token.MINTER_ROLE();
  if (!(await token.hasRole(MINTER_ROLE, reserve.target))) {
    console.log("🔑 Granting minter role to reserve...");
    await token.grantRole(MINTER_ROLE, reserve.target);
  }

  // Buy HLX for test users
  console.log("\n💰 Buying HLX for test users...");
  const ethAmount = hre.ethers.parseEther("10");

  for (const user of [originator, userA, userB, userC]) {
    const tx = await reserve.connect(user).buy({ value: ethAmount });
    await tx.wait();
    const balance = await token.balanceOf(user.address);
    console.log(`  ${user.address}: ${hre.ethers.formatEther(balance)} HLX`);
  }

  // Approve market to spend HLX
  console.log("\n✅ Approving market to spend HLX...");
  const approveAmount = hre.ethers.parseEther("100000");
  for (const user of [originator, userA, userB, userC]) {
    await token.connect(user).approve(market.target, approveAmount);
  }

  // Create market
  console.log("\n📝 Creating market...");
  const ipfsCid = "QmSampleCIDForTestingPurposes12345";
  const biddingDuration = 3600; // 1 hour
  const revealDuration = 3600; // 1 hour

  const tx = await market.connect(originator).submitStatement(
    ipfsCid,
    biddingDuration,
    revealDuration
  );
  const receipt = await tx.wait();

  const marketId = 0; // First market
  console.log(`  Market ID: ${marketId}`);
  console.log(`  IPFS CID: ${ipfsCid}`);
  console.log(`  Commit Duration: ${biddingDuration}s (${biddingDuration / 3600}h)`);
  console.log(`  Reveal Duration: ${revealDuration}s (${revealDuration / 3600}h)`);

  // Commit bets
  console.log("\n🎯 Committing bets...");

  const salt1 = 12345;
  const salt2 = 67890;
  const salt3 = 11111;

  const yesAmount = hre.ethers.parseEther("50");
  const noAmount = hre.ethers.parseEther("30");
  const unalignedAmount = hre.ethers.parseEther("20");

  const buildCommit = (choice, salt, user) => {
    return hre.ethers.solidityPackedKeccak256(
      ["uint8", "uint256", "address"],
      [choice, salt, user]
    );
  };

  // YES bet from userA
  const commitHashA = buildCommit(1, salt1, userA.address);
  await (await market.connect(userA).commitBet(marketId, commitHashA, yesAmount)).wait();
  console.log(`  UserA: YES - ${hre.ethers.formatEther(yesAmount)} HLX`);

  // NO bet from userB
  const commitHashB = buildCommit(0, salt2, userB.address);
  await (await market.connect(userB).commitBet(marketId, commitHashB, noAmount)).wait();
  console.log(`  UserB: NO - ${hre.ethers.formatEther(noAmount)} HLX`);

  // UNALIGNED bet from userC
  const commitHashC = buildCommit(2, salt3, userC.address);
  await (await market.connect(userC).commitBet(marketId, commitHashC, unalignedAmount)).wait();
  console.log(`  UserC: UNALIGNED - ${hre.ethers.formatEther(unalignedAmount)} HLX`);

  console.log("\n⏰ Market lifecycle:");
  console.log("  Status: Commit phase active");
  console.log("  Next: Wait for commit phase to end, then reveal bets");
  console.log("  Then: Wait for reveal phase to end, then resolve market");
  console.log("  Finally: Winners can claim their rewards");

  console.log("\n✨ Simulation complete!");
  console.log("\n📝 To reveal bets (after commit phase ends), run:");
  console.log(`  npx hardhat console --network localhost`);
  console.log(`  Then use the following salt values:`);
  console.log(`    userA (YES): ${salt1}`);
  console.log(`    userB (NO): ${salt2}`);
  console.log(`    userC (UNALIGNED): ${salt3}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
