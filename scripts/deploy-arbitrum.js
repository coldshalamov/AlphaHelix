const { deployContracts } = require("./deploy");

async function main() {
  console.log("Deploying to Arbitrum Sepolia network (ensure env vars are set)");
  await deployContracts();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
