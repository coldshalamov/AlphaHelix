const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function deployContracts() {
  console.log("=== AlphaHelix Deployment Start ===");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  console.log("\n-> Deploying AlphaHelixToken");
  const AlphaHelixToken = await hre.ethers.getContractFactory("AlphaHelixToken");
  const token = await AlphaHelixToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("AlphaHelixToken deployed to:", tokenAddress);

  console.log("\n-> Deploying HelixReserve");
  const HelixReserve = await hre.ethers.getContractFactory("HelixReserve");
  const reserve = await HelixReserve.deploy(tokenAddress);
  await reserve.waitForDeployment();
  const reserveAddress = await reserve.getAddress();
  console.log("HelixReserve deployed to:", reserveAddress);

  console.log("\n-> Deploying HelixMarket");
  const HelixMarket = await hre.ethers.getContractFactory("HelixMarket");
  const market = await HelixMarket.deploy(tokenAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("HelixMarket deployed to:", marketAddress);

  console.log("\n-> Granting MINTER_ROLE to HelixReserve");
  const MINTER_ROLE = await token.MINTER_ROLE();
  const tx = await token.grantRole(MINTER_ROLE, reserveAddress);
  await tx.wait();
  console.log("MINTER_ROLE granted");

  console.log("\n-> Writing contract addresses to frontend/src/config/contracts.json");
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
  console.log("Contract addresses saved");

  console.log("\n=== Deployment complete ===");
  return addresses;
}

async function main() {
  await deployContracts();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

module.exports = { deployContracts };
