# AlphaHelix Project Overview

AlphaHelix is a commit-reveal prediction market where HLX holders stake on the truthfulness of user-submitted statements. Markets are created with an IPFS CID reference and run through timed commit and reveal windows before being resolved purely by comparing YES and NO stake weights. Unaligned stake exists to reward decisive outcomes and is swept to the winning side when there is a winner.

## HelixMarket invariants
- **Commit/Reveal:** Users commit `keccak256(choice, salt, bettor)` during the commit window, then reveal `(choice, salt)` during the reveal window. Reveals after `revealEndTime` are rejected.
- **Pools:** Three HLX pools per market (YES, NO, UNALIGNED). Stakes move from committed balances to pools only upon a valid reveal.
- **Outcome rule:** YES wins if `yesPool > noPool`; NO wins if `noPool > yesPool`; ties (equal pools) produce no winner.
- **Payouts & fees:**
  - Non-tie: totalPool = yes + no + unaligned. Originator fee = `totalPool * 1%` (floor). Reward pool = totalPool − fee; winning side splits the reward pool pro-rata and sweeps the entire UNALIGNED pool.
  - Tie: no originator fee. Every bettor (YES/NO/UNALIGNED) can claim a full refund of their stake.
- **Unrevealed commits:** Committers who never reveal can withdraw their locked HLX after `revealEndTime` with a 1% burn penalty; revealed stakes cannot be withdrawn this way.
- **No admin keys:** No pause, override, or admin-only payout paths exist; outcomes are immutable and mechanically determined.
- **No external oracles:** Outcomes depend solely on on-chain stake balances; no off-chain data sources are consulted.

## HLX token and reserve
- **AlphaHelixToken:** ERC20 with `MINTER_ROLE`/`DEFAULT_ADMIN_ROLE` controlling mint/burn capabilities. Used for market staking and reserve conversions.
- **HelixReserve:** Fixed-rate AMM (1 ETH ↔ 1000 HLX). `buy` mints HLX for ETH; `sell` burns HLX in exchange for ETH (must convert to whole wei). Owner can seed downstream market AMMs via `seedMarket`.

## Out-of-scope (Alpha)
- Generative compression, Telomere mechanisms, or Helix v3 concepts are intentionally excluded from this alpha codebase.

## Spec vs Code Gaps
- None currently identified; note that fee and penalty calculations use integer division (floor), so tiny remainders stay in the contract.
