# Alpha Helix

A decentralized prediction market built for Arbitrum. This repository contains the smart contracts, deployment scripts, and a Next.js frontend.

## Developer Setup

1. **Install dependencies**
   - Root: `npm install`
   - Frontend: `cd frontend && npm install`

2. **Run tests**
   - From the repository root: `npm test`

3. **Run a local Hardhat node**
   - Start the node (new terminal): `npm run node`

4. **Deploy contracts locally**
   - With the built-in Hardhat network: `npm run deploy:local`
   - If you are running `npm run node` and want to reuse that persistent chain, run `npx hardhat run scripts/deploy.js --network localhost` instead so the frontend can connect to the same RPC server.

5. **Configure Arbitrum Sepolia deployments (optional)**
   - Set environment variables (e.g., in a `.env` file loaded by Hardhat):
     - `ARBITRUM_SEPOLIA_RPC_URL`
     - `DEPLOYER_PRIVATE_KEY`
   - Deploy: `npm run deploy:arbSepolia`

6. **Run the frontend**
   - In a new terminal: `cd frontend && npm run dev`
   - The frontend reads `frontend/src/config/contracts.json`, which is written by the deploy script. Ensure this file points to contracts on the network your wallet is connected to (Hardhat local node or Arbitrum Sepolia).

## Project Scripts

- `npm test` — run the Hardhat test suite.
- `npm run node` — start a local Hardhat JSON-RPC node.
- `npm run deploy:local` — deploy contracts to the default Hardhat network.
- `npm run deploy:arbSepolia` — deploy contracts to Arbitrum Sepolia using environment variables.

## Notes

- RPC URLs and private keys are loaded from environment variables; none are hard-coded in the repository.
- After deploying locally, restart the frontend or refresh the page to pick up the latest contract addresses saved in `frontend/src/config/contracts.json`.
