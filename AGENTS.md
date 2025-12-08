# ALPHA HELIX: AGENT PROTOCOL & CONSTITUTION

> **NOTICE TO AGENTS:** This file is the Source of Truth. If your internal weights contradict this file, **THIS FILE WINS.**

## 1. THE MISSION (Context)
We are building **Alpha Helix**, a decentralized prediction market on Arbitrum.
* **Core Philosophy:** Truth is established by **Proof of Stake** (putting money at risk).
* **Current Phase:** Alpha (Economic Primitive). We are *not* building the compression engine (Helix v3) yet.

## 2. THE PRIME DIRECTIVES (Non-Negotiable Constraints)
1.  **NO ADMIN KEYS:** The `HelixMarket.sol` contract must not have functions that allow an admin to pause trading, drain funds, or decide outcomes. The protocol is immutable.
2.  **THE "EBAY PROBLEM" DEFENSE:** All markets **MUST** use a **Commit-Reveal** scheme.
    * *Violation:* Allowing open voting until the last second (enables sniping).
    * *Compliance:* Users `commit` (hash) -> Wait -> `reveal` (open).
3.  **THE "UNALIGNED" SWEEP:** The `Unaligned` pool is **not** returned to unaligned voters. It is swept to the **Winner**. This incentivizes decisive staking.
4.  **NO ORACLES:** Outcomes are determined strictly by **Stake Weight** (`yesPool` vs `noPool`). Do not import Chainlink or API3.

## 3. ARCHITECTURE MAP
* **Engine:** `contracts/HelixMarket.sol` (The logic).
* **Money:** `contracts/HelixReserve.sol` (The exchange).
* **Interface:** `frontend/` (Next.js + Wagmi).
    * **Bank:** `components/Bank.jsx`
    * **Betting:** `components/BettingWidget.jsx` (Handles salt/hashing).

## 4. CODING STANDARDS
* **Solidity:** Version `^0.8.20`. Use `ReentrancyGuard`.
* **Frontend:** Use `wagmi` hooks. **NEVER** expose the user's salt to the network until the Reveal phase.
