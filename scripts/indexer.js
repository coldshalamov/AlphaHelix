#!/usr/bin/env node
/*
 * Lightweight event indexer for HelixMarket.
 * Reads on-chain events and writes a JSON snapshot of markets and bets.
 */
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
require("dotenv").config();

const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const MARKET_ADDRESS = process.env.HELIX_MARKET_ADDRESS;
const START_BLOCK = Number.parseInt(process.env.INDEXER_START_BLOCK || "0", 10);
const OUTPUT_FILE = process.env.INDEXER_OUTPUT || path.join(__dirname, "../cache/index.json");

if (!MARKET_ADDRESS) {
  console.error("Missing HELIX_MARKET_ADDRESS env var. Set the deployed HelixMarket address.");
  process.exit(1);
}

const helixArtifact = require("../artifacts/contracts/HelixMarket.sol/HelixMarket.json");
const provider = new ethers.JsonRpcProvider(RPC_URL);
const market = new ethers.Contract(MARKET_ADDRESS, helixArtifact.abi, provider);

const defaultState = () => ({ markets: {}, bets: {}, meta: { lastProcessedBlock: START_BLOCK - 1, lastUpdated: null } });

function loadState() {
  try {
    const raw = fs.readFileSync(OUTPUT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return defaultState();
  }
}

function saveState(state) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(state, null, 2));
}

const blockTimeCache = new Map();
async function getTimestamp(blockNumber) {
  if (!blockTimeCache.has(blockNumber)) {
    const block = await provider.getBlock(blockNumber);
    blockTimeCache.set(blockNumber, Number(block.timestamp));
  }
  return blockTimeCache.get(blockNumber);
}

const toStringValue = (value) => (typeof value === "bigint" ? value.toString() : String(value));
const addStrings = (a, b) => (BigInt(a || 0) + BigInt(b || 0)).toString();

function ensureMarket(state, marketId) {
  if (!state.markets[marketId]) {
    state.markets[marketId] = {
      id: marketId,
      ipfsCid: null,
      originator: null,
      commitEndTime: null,
      revealEndTime: null,
      yesPool: "0",
      noPool: "0",
      unalignedPool: "0",
      resolved: false,
      outcome: null,
      tie: null,
      totalFeeCollected: "0",
      totalPool: "0",
    };
  }
  return state.markets[marketId];
}

function ensureBet(state, marketId, user) {
  const key = `${marketId}:${user.toLowerCase()}`;
  if (!state.bets[key]) {
    state.bets[key] = {
      id: key,
      marketId,
      user: user.toLowerCase(),
      side: null,
      amount: "0",
      committedAt: null,
      revealedAt: null,
    };
  }
  return state.bets[key];
}

async function handleStatementCreated(state, log) {
  const { marketId, ipfsCid, commitEndTime, revealEndTime, originator } = log.args;
  const marketEntry = ensureMarket(state, toStringValue(marketId));
  marketEntry.ipfsCid = ipfsCid;
  marketEntry.commitEndTime = Number(commitEndTime);
  marketEntry.revealEndTime = Number(revealEndTime);
  marketEntry.originator = originator.toLowerCase();
}

async function handleBetCommitted(state, log) {
  const { marketId, user, amount } = log.args;
  const timestamp = await getTimestamp(log.blockNumber);
  const bet = ensureBet(state, toStringValue(marketId), user);
  bet.committedAt = timestamp;
  bet.amount = toStringValue(amount);
}

async function handleBetRevealed(state, log) {
  const { marketId, user, choice, amount } = log.args;
  const timestamp = await getTimestamp(log.blockNumber);
  const amountStr = toStringValue(amount);
  const marketEntry = ensureMarket(state, toStringValue(marketId));
  const bet = ensureBet(state, toStringValue(marketId), user);

  const side = Number(choice);
  bet.side = side;
  bet.amount = amountStr;
  bet.revealedAt = timestamp;

  if (side === 1) {
    marketEntry.yesPool = addStrings(marketEntry.yesPool, amountStr);
  } else if (side === 0) {
    marketEntry.noPool = addStrings(marketEntry.noPool, amountStr);
  } else if (side === 2) {
    marketEntry.unalignedPool = addStrings(marketEntry.unalignedPool, amountStr);
  }
  marketEntry.totalPool = addStrings(marketEntry.totalPool, amountStr);
}

async function handleMarketResolved(state, log) {
  const { marketId, outcome, tie, totalPool, originatorFee } = log.args;
  const marketEntry = ensureMarket(state, toStringValue(marketId));
  marketEntry.resolved = true;
  marketEntry.outcome = Boolean(outcome);
  marketEntry.tie = Boolean(tie);
  marketEntry.totalPool = toStringValue(totalPool);
  marketEntry.totalFeeCollected = addStrings(marketEntry.totalFeeCollected, originatorFee.toString());
}

async function processEvents(state, fromBlock, toBlock) {
  const logs = await market.queryFilter({}, fromBlock, toBlock);
  for (const log of logs) {
    switch (log.eventName) {
      case "StatementCreated":
        await handleStatementCreated(state, log);
        break;
      case "BetCommitted":
        await handleBetCommitted(state, log);
        break;
      case "BetRevealed":
        await handleBetRevealed(state, log);
        break;
      case "MarketResolved":
        await handleMarketResolved(state, log);
        break;
      default:
        break;
    }
  }
}

async function main() {
  const state = loadState();
  const fromBlock = Math.max(state.meta.lastProcessedBlock + 1, START_BLOCK);
  const latestBlock = await provider.getBlockNumber();

  if (fromBlock > latestBlock) {
    console.log(`No new blocks to index. Latest: ${latestBlock}`);
    return;
  }

  console.log(`Indexing HelixMarket at ${MARKET_ADDRESS} from block ${fromBlock} to ${latestBlock} ...`);
  await processEvents(state, fromBlock, latestBlock);
  state.meta.lastProcessedBlock = latestBlock;
  state.meta.lastUpdated = new Date().toISOString();
  saveState(state);
  console.log(`Indexed through block ${latestBlock}. Saved to ${OUTPUT_FILE}.`);
}

main().catch((err) => {
  console.error("Indexer failed", err);
  process.exit(1);
});
