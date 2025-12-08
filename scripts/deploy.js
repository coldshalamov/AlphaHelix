const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy AlphaHelixToken
  const AlphaHelixToken = await hre.ethers.getContractFactory("AlphaHelixToken");
  const token = await AlphaHelixToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("AlphaHelixToken deployed to:", tokenAddress);

  // 2. Deploy HelixReserve
  const HelixReserve = await hre.ethers.getContractFactory("HelixReserve");
  const reserve = await HelixReserve.deploy(tokenAddress);
  await reserve.waitForDeployment();
  const reserveAddress = await reserve.getAddress();
  console.log("HelixReserve deployed to:", reserveAddress);

  // 3. Deploy HelixMarket
  const HelixMarket = await hre.ethers.getContractFactory("HelixMarket");
  const market = await HelixMarket.deploy(tokenAddress);
  await market.waitForDeployment();
  const marketAddress = await market.getAddress();
  console.log("HelixMarket deployed to:", marketAddress);

  // 4. Grant MINTER_ROLE to Reserve
  const MINTER_ROLE = await token.MINTER_ROLE();
  const tx = await token.grantRole(MINTER_ROLE, reserveAddress);
  await tx.wait();
  console.log("Granted MINTER_ROLE to HelixReserve");

  // 5. Write addresses to frontend config
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
