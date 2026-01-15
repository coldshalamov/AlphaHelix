# Indexing / analytics (alpha)

This repository ships a lightweight off-chain indexer to make it easier for the frontend and tooling to list markets and user positions without iterating on-chain state.

In addition to market lifecycle events, the indexer also captures `Claimed` and `UnrevealedWithdrawn` so UIs can show whether a position has been claimed (or forfeited).

## Setup

1. Install dependencies (Hardhat already vendors `ethers`):

   ```bash
   npm install
   ```

2. Export environment variables:

   - `RPC_URL` – JSON-RPC endpoint (local Hardhat, Arbitrum Sepolia, etc.). Defaults to `http://localhost:8545`.
   - `HELIX_MARKET_ADDRESS` – deployed `HelixMarket` address to index (required).
   - `INDEXER_START_BLOCK` – first block to start scanning from (defaults to `0`).
   - `INDEXER_OUTPUT` – file path for the JSON snapshot (defaults to `cache/index.json`).

## Running the indexer

```bash
node scripts/indexer.js
```

The script scans `HelixMarket` events, normalizes them into a JSON snapshot, and writes it to `INDEXER_OUTPUT`. It keeps `meta.lastProcessedBlock`, so rerunning will continue from where it left off.

## Data model

The JSON snapshot contains two top-level maps: `markets` and `bets`.

- `markets[marketId]` includes:
  - `ipfsCid`, `originator`, `commitEndTime`, `revealEndTime`
  - `yesPool`, `noPool`, `unalignedPool`, `totalPool`
  - `resolved`, `outcome`, `tie`, `totalFeeCollected`
- `bets["<marketId>:<user>"]` includes:
  - `marketId`, `user`, `side` (0 = NO, 1 = YES, 2 = UNALIGNED)
  - `amount`
  - `committedAt` and `revealedAt` timestamps (unix seconds)
  - `claimedAt` and `payout` (when claimed)
  - `unrevealedWithdrawnAt`, `penaltyBurned`, and `amountReturned` (when forfeited)

### Example snapshot (truncated)

```json
{
  "markets": {
    "0": {
      "id": "0",
      "ipfsCid": "baf...",
      "originator": "0xabc...",
      "commitEndTime": 1734912000,
      "revealEndTime": 1734998400,
      "yesPool": "250000000000000000000",
      "noPool": "100000000000000000000",
      "unalignedPool": "0",
      "totalPool": "350000000000000000000",
      "resolved": true,
      "outcome": true,
      "tie": false,
      "totalFeeCollected": "3500000000000000000"
    }
  },
  "bets": {
    "0:0xabc...": {
      "id": "0:0xabc...",
      "marketId": "0",
      "user": "0xabc...",
      "side": 1,
      "amount": "250000000000000000000",
      "committedAt": 1734910000,
      "revealedAt": 1734912100
    }
  },
  "meta": {
    "lastProcessedBlock": 123456,
    "lastUpdated": "2024-12-01T10:00:00.000Z"
  }
}
```

## Querying the snapshot

Because the snapshot is JSON, you can use `jq` or a small Node script to surface analytics without touching the chain. Examples assume the default `cache/index.json` path.

### Markets with the most volume

```bash
jq '.markets | to_entries | map(.value) | sort_by(.totalPool | tonumber) | reverse | .[0:5] | map({id: .id, totalPool: .totalPool, yesPool: .yesPool, noPool: .noPool, unalignedPool: .unalignedPool})' cache/index.json
```

### A user’s positions

```bash
USER=0x123...
jq --arg user "$(echo $USER | tr '[:upper:]' '[:lower:]')" '.bets | to_entries | map(.value) | map(select(.user == $user))' cache/index.json
```

### Programmatic access (Node)

```js
import fs from "fs";

const state = JSON.parse(fs.readFileSync("cache/index.json", "utf8"));
const openMarkets = Object.values(state.markets).filter((m) => !m.resolved);
const userPositions = Object.values(state.bets).filter((b) => b.user === "0x123...");
```

## Frontend usage (optional)

The frontend can read `cache/index.json` (or host it via a thin API) to render market lists and user positions more efficiently than contract iteration. Keep the on-chain path as a fallback so the UI remains trustless when the indexer lags.
