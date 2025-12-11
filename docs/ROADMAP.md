# Roadmap

## Phase 0: Spec and docs
- [ ] Keep PROJECT_OVERVIEW.md aligned with on-chain behavior (commit/reveal, tie refunds, unaligned sweep, penalties).
- [ ] Expand diagrams/sequence descriptions for commit → reveal → resolve lifecycle.

## Phase 1: Contract correctness & economics
- [ ] Re-audit HelixMarket math for rounding edge cases (fee/penalty floors, dust handling).
- [ ] Add invariant tests for zero-value pools and multi-commit scenarios.
- [ ] Evaluate need for event indexing/coverage for all state changes.
- [ ] Review HelixReserve owner powers and ETH float requirements.

## Phase 2: Tests (HelixMarket and HelixReserve)
- [ ] Add negative tests for malformed salts/choices and double-claim attempts.
- [ ] Add HelixReserve buy/sell/seedMarket edge-case tests (insufficient ETH, RATE divisibility).
- [ ] Integrate gas snapshots or fuzzing for payout calculations.

## Phase 3: Frontend scaffolding
- [ ] Convert frontend/ into a cohesive Next.js app shell with routing for market list/detail.
- [ ] Wire wagmi connectors and contract calls for commit/reveal/claim flows.
- [ ] Add client-side validation for salt handling and timing windows.

## Phase 4: UX polish
- [ ] Market listing cards with live commit/reveal countdowns.
- [ ] Detail view showing pool sizes, expected payout previews, and unaligned sweep explanation.
- [ ] Claim/withdraw UX with clear tie/refund messaging and unrevealed withdrawal flow.

## Phase 5: Deployment config and scripts
- [ ] Harden Hardhat network configs for Arbitrum Sepolia and local dev (RPC URLs, gas settings).
- [ ] Add deployment scripts for token, reserve, and market with environment-driven addresses.
- [ ] Document environment variables and verification steps.

## Phase 6 (optional): Analytics / subgraph / security
- [ ] Draft subgraph schema for statements, commits, reveals, and claims.
- [ ] Run an external security review and document threat model gaps.
- [ ] Add minimal analytics hooks (events logging) without introducing oracles/admin keys.
