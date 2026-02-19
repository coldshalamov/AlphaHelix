require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("solidity-coverage");
require("hardhat-gas-reporter");

const { ARBITRUM_SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY, ARBISCAN_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {},
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_RPC_URL || "",
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: ARBISCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    outputFile: "gas-report.txt",
    noColors: true,
  },
};
