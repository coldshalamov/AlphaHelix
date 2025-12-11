# AlphaHelix Frontend

A minimal Next.js + wagmi shell for interacting with the Helix Reserve (bank) and Helix Market (commit/reveal betting).

## Prerequisites
- Node.js 18+
- Hardhat local node (`npx hardhat node`) or Arbitrum Sepolia RPC URL

## Setup
1. Start a local chain and deploy the contracts from the repo root:
   ```bash
   npx hardhat node
   node scripts/deploy.js
   ```
   This writes the local addresses into `frontend/src/config/contracts.json`.

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Run the development server (defaults to localhost chain at `127.0.0.1:8545`):
   ```bash
   npm run dev
   ```

4. For Arbitrum Sepolia, set an RPC in your environment before running dev/build:
   ```bash
   export NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
   ```

## Navigation
- **Home**: quick links to Bank and Markets.
- **Bank**: swap ETH ↔ HLX using `HelixReserve`.
- **Markets**: pulls `marketCount` and `markets[id]` from `HelixMarket` to display existing statements.
- **Market detail**: view a single market and use the commit/reveal betting widget. Salts stay client-side in `localStorage` per market + address.

## Notes
- The wagmi client supports Hardhat (chain id 31337) and Arbitrum Sepolia (421614). Override RPC URLs with `NEXT_PUBLIC_LOCAL_RPC_URL` and `NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL`.
- The betting widget only reveals if it finds a locally stored commitment; keep the same browser/device between commit and reveal.
