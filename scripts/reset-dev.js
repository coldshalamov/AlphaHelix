/**
 * Reset Development Environment
 *
 * This script:
 * 1. Cleans build artifacts
 * 2. Recompiles contracts
 * 3. Deploys contracts to local network
 * 4. Updates frontend config
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function exec(command, description) {
  console.log(`\n📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} complete`);
  } catch (error) {
    console.error(`❌ ${description} failed`);
    throw error;
  }
}

async function main() {
  console.log('🔄 Resetting development environment...\n');

  // 1. Clean artifacts
  exec('npx hardhat clean', 'Cleaning build artifacts');

  // 2. Compile contracts
  exec('npx hardhat compile', 'Compiling contracts');

  // 3. Deploy to local hardhat network
  exec('npx hardhat run scripts/deploy.js --network hardhat', 'Deploying contracts');

  console.log('\n✨ Development environment reset complete!');
  console.log('\n📝 Next steps:');
  console.log('  1. Start local node: npm run node');
  console.log('  2. Start frontend: cd frontend && npm run dev');
  console.log('  3. Connect MetaMask to localhost:8545');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
