const hre = require("hardhat");
const contracts = require("../frontend/src/config/contracts.json");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const Market = await hre.ethers.getContractFactory("HelixMarket");
  const market = Market.attach(contracts.HelixMarket);

  const reserveAddress = contracts.HelixReserve;

  const fiftyWeeks = 50 * 7 * 24 * 60 * 60;
  for (let i = 0; i < 9; i++) {
    const tx = await market.connect(deployer).submitStatement(`ipfs://QmPaginationMarket${i}`, fiftyWeeks, fiftyWeeks);
    await tx.wait();
    console.log(`Created market ${i+4}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
