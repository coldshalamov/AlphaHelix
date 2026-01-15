const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function readAddresses() {
  const fallbackPath = path.join(__dirname, "../frontend/src/config/contracts.json");
  if (!fs.existsSync(fallbackPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
  } catch (err) {
    return {};
  }
}

function getRequiredAddress(name, envKey, addresses, addressesKey) {
  const fromEnv = process.env[envKey];
  const fromFile = addresses[addressesKey];
  const value = fromEnv || fromFile;
  if (!value) {
    throw new Error(`Missing ${name} address. Provide ${envKey} or set ${addressesKey} in frontend/src/config/contracts.json.`);
  }
  return value;
}

async function verifyOne(label, address, constructorArguments) {
  console.log(`\n[verify] ${label}: ${address}`);
  try {
    await hre.run("verify:verify", { address, constructorArguments });
    console.log(`[verify] OK: ${label}`);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.toLowerCase().includes("already verified")) {
      console.log(`[verify] Already verified: ${label}`);
      return;
    }
    throw err;
  }
}

async function main() {
  const addresses = readAddresses();

  const tokenAddress = getRequiredAddress("AlphaHelixToken", "TOKEN_ADDR", addresses, "AlphaHelixToken");
  const reserveAddress = getRequiredAddress("HelixReserve", "RESERVE_ADDR", addresses, "HelixReserve");
  const marketAddress = getRequiredAddress("HelixMarket", "MARKET_ADDR", addresses, "HelixMarket");

  await verifyOne("AlphaHelixToken", tokenAddress, []);
  await verifyOne("HelixReserve", reserveAddress, [tokenAddress]);
  await verifyOne("HelixMarket", marketAddress, [tokenAddress]);
}

main().catch((error) => {
  console.error("[verify] Failed", error);
  process.exitCode = 1;
});

