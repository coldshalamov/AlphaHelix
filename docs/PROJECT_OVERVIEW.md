# AlphaHelix Project Overview

AlphaHelix is a **stake-weighted consensus system** (not an AMM) where HLX holders commit capital to binary outcomes. Markets resolve through a commit-reveal mechanism to prevent front-running, with the outcome determined **purely by stake size** (whichever side has more HLX wins). This creates a censorship-resistant truth oracle where conviction is measured by financial risk.

## What This Is (and Isn't)

- ✅ **Stake aggregation pool** with winner-take-all payouts
- ✅ **Commit-reveal voting** with financial skin in the game
- ✅ **Sybil-resistant consensus** (weighted by HLX holdings)
- ❌ **NOT a prediction market** (no price discovery, no continuous trading)
- ❌ **NOT an AMM** (no bonding curves, no liquidity pools)
- ❌ **NOT oracle-based** (outcome is determined by stake weight, not external truth)

## Core Mechanism

Markets are created with an IPFS CID reference and run through timed commit and reveal windows before being resolved purely by comparing YES and NO stake weights.

### The UNALIGNED Pool: Universal Truth Oracle

The UNALIGNED pool is a **bounty mechanism** that makes AlphaHelix a universal truth oracle (not just a prediction market for controversial topics):

- **Problem**: Traditional prediction markets only work for controversial statements (no controversy → no bets → no originator fee)
- **Solution**: UNALIGNED lets interested parties **subsidize validation** of low-salience or obvious facts
- **Use cases**:
  - Smart contract escrows (proof of work validation)
  - Knowledge base seeding (paying to add scientific facts)
  - DAO activity tracking (conflict-free validation)
  - Honeypots for lies (incentivize challenges to fraud)

The UNALIGNED pool is swept to the winning side, creating a bounty that anyone can claim by proving the correct outcome. See [UNALIGNED_POOL_RATIONALE.md](UNALIGNED_POOL_RATIONALE.md) for full details.

## HelixMarket invariants
- **Commit/Reveal:** Users commit `keccak256(choice, salt, bettor)` during the commit window, then reveal `(choice, salt)` during the reveal window. Reveals after `revealEndTime` are rejected.
- **Pools:** Three HLX pools per market (YES, NO, UNALIGNED). Stakes move from committed balances to pools only upon a valid reveal.
- **Outcome rule:** YES wins if `yesPool > noPool`; NO wins if `noPool > yesPool`; ties (equal pools) produce no winner.
- **Payouts & fees:**
  - Non-tie: totalPool = yes + no + unaligned. Originator fee = `totalPool * 1%` (floor). Reward pool = totalPool - fee; winning side splits the reward pool pro-rata and sweeps the entire UNALIGNED pool.
  - Tie: no originator fee. Every bettor (YES/NO/UNALIGNED) can claim a full refund of their stake.
- **Unrevealed commits:** Committers who never reveal can withdraw their locked HLX after `revealEndTime` with a 100% burn penalty; revealed stakes cannot be withdrawn this way.
- **No admin keys:** No pause, override, or admin-only payout paths exist; outcomes are immutable and mechanically determined.
- **No external oracles:** Outcomes depend solely on on-chain stake balances; no off-chain data sources are consulted.

## Checked Invariants
- Winner payouts plus the originator fee never exceed the total pool collected for a market; any integer rounding remainder is assigned to the last winning claimant.
- Pro-rata payouts match the on-chain formula across balanced, skewed, and minimal-stake markets, including when unaligned stake is swept to the winner.
- Losing bettors cannot withdraw after resolution, and unrevealed withdrawals only operate on still-committed stakes and apply the burn penalty.

## HLX token and reserve
- **AlphaHelixToken:** ERC20 with `MINTER_ROLE`/`DEFAULT_ADMIN_ROLE` controlling mint/burn capabilities. Used for market staking and reserve conversions.
- **HelixReserve:** Fixed-rate AMM (1 ETH <-> 1000 HLX). `buy` mints HLX for ETH; `sell` burns HLX in exchange for ETH (must convert to whole wei). Owner can seed downstream market AMMs via `seedMarket`.

## Out-of-scope (Alpha)
- Generative compression, Telomere mechanisms, or Helix v3 concepts are intentionally excluded from this alpha codebase.

## Spec vs Code Gaps
- None currently identified; note that fee calculations use integer division (floor), and unclaimed winnings remain in the contract until claimed.
