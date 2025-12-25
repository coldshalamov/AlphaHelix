# Alpha-Helix Architecture Overview

Alpha-Helix is a minimal Arbitrum-native implementation of the Helix philosophy: a market-driven protocol that lets people stake capital on precise truth claims, continuously converge on consensus, and export those outcomes to other smart contracts. This version preserves the epistemic incentives described in the Helix papers while deferring advanced compression/mining mechanics to a later chain migration.

## Design Goals

1. **Market-priced truth** – Truth emerges from adversarial prediction markets instead of authority. Users stake HLX on mutually exclusive outcomes (True / False), with an Unaligned pool channelling capital toward whichever side wins to reward resolution pressure.
2. **Noise firewall** – Creating a claim requires an escrowed stake and gas. Claims that fail to attract engagement waste that stake, discouraging low-effort spam.
3. **Continuous revision** – A resolved claim can be reopened via a higher-staked challenge that spins up a fresh market round with the previous result as historical context. Over time, statements accumulate a confidence trail instead of a one-off vote.
4. **Oracle composability** – Any dApp can subscribe to claim outcomes or require its own transactions to reference a Helix claim, using the on-chain markets as a decentralized oracle layer.
5. **Migration-ready HLX token** – HLX is an ERC-20 with EIP-2612 permits, voting checkpoints, and dedicated bridge roles so it can seamlessly migrate between Arbitrum and a future Helix main chain.

## Contract Topology

```
HLXToken (ERC20Votes + Permit)
   |
   ├── grantRole(BRIDGE_ROLE) ➜ L1<->L2 bridge contracts
   └── grantRole(MINTER_ROLE) ➜ AlphaHelixTreasury (collects penalties / fees)

AlphaHelixParameters (governance-controlled)
   ├── creationBond (minimum HLX stake to spin up a claim)
   ├── resolutionDelay (cooldown between betting close and resolution)
   ├── challengeBondMultiplier (required stake to reopen a claim)
   └── feeBps (protocol cut from losing pools + unaligned pool)

AlphaHelixRegistry
   ├── normalizeClaim() ➜ keccak256 hash for deduplication
   ├── createClaim() ➜ deploys TruthMarket clone via MarketFactory, escrow creation bond
   ├── recordResolution() ➜ emits canonical outcome for cross-contract use
   └── reopenClaim() ➜ triggered when challenge bond > previous liquidity; increments version

MarketFactory (EIP-1167 clone dispatcher)
   ├── deployTruthMarket(initializationData)
   └── upgradeImplementation(newTemplate) ➜ controlled by governance

TruthMarket (Upgradeable clone)
   ├── placeBet(outcome, amount) – True / False / Unaligned
   ├── addLiquidity(amountTrue, amountFalse, amountUnaligned)
   ├── close() – freezes betting after cutoff timestamp
   ├── resolve() – selects winning side by highest bonded capital (True vs False)
   ├── claimPayout() – winning bettors share losing + unaligned pools minus protocol fee
   └── exportOutcome() – pushes result + confidence metrics back to AlphaHelixRegistry
```

### Outcome Mechanics

- **Pools** – Constant-product market maker (3 outcome balances). LP shares are ERC-1155-style balances that allow single-sided or tri-sided provisioning while maintaining invariant `k`.
- **Order Flow** – `placeBet` buys additional shares in the chosen outcome by swapping against the invariant; `sellShares` lets traders exit prior to closure.
- **Resolution** – After the `resolutionDelay`, anyone can call `resolve`. The outcome with the greatest total HLX (including LP exposure) wins. Unaligned balance is streamed to winners in proportion to their final exposure. If True and False balances tie, the round is labelled `Unresolved`, and the registry immediately opens a new round requiring a higher challenge bond.
- **Confidence Score** – Markets propagate a `confidenceBps` metric calculated as `(winningStake - losingStake) * 10_000 / totalStake`. External contracts can use this to enforce minimum confidence thresholds.

### Challenge Loop

1. Resolution emits `ClaimOutcome(claimId, version, outcome, confidenceBps)`.
2. Anyone who disagrees can call `reopenClaim` by staking `challengeBondMultiplier * totalStake`. The registry deploys a new market version with the challenger’s stake seeded equally across True/False so they cannot bias the opening price.
3. Previous winners keep their payouts, but the protocol tracks historical outcomes so applications can choose which confidence tier to honor.

## Treasury & Incentives

- **Creation Bond** – Refunded to the claim creator only if the market resolves (including Unresolved) without being spam-flagged. Otherwise, it is slashed to treasury.
- **Protocol Fee** – A configurable cut of the losing pools + unaligned pool funds treasury operations and long-term grants for data quality tooling.
- **Governance** – HLX token holders (via ERC20Votes) control parameter updates, treasury disbursements, and implementation upgrades. Once deployed, deployer should immediately transfer admin roles to the Alpha-Helix DAO and renounce them.

## Migration Path

- `HLXToken` exposes `bridgeMint` / `bridgeBurn` restricted to a `BRIDGE_ROLE` that can be handed to Arbitrum’s canonical gateway today and swapped for a bespoke Helix bridge later.
- `AlphaHelixRegistry` stores claim history and market metadata in an L1-compatible format so the entire state can be checkpointed and reproduced on a future Helix chain.
- All markets emit deterministic events (`ClaimOutcome`, `ChallengeOpened`, `PayoutClaimed`) facilitating state replication by a migration contract that can mint equivalent LP positions / outstanding wagers on the target chain.

## External Interfaces

- **`ITruthMarket`** – View helpers for total stakes, invariant `k`, current state, and winning outcome once resolved.
- **`IAlphaHelixRegistry`** – Application-layer contracts query claim status and subscribe to outcome events.

## Security Considerations

- Reentrancy guards are placed on state-mutating functions that transfer tokens.
- Markets rely on `block.timestamp` for cutoffs; Arbitrum L2 clock is bounded by L1.
- Numerical operations use `SafeCast` and `Math` from OpenZeppelin to protect against overflow when computing invariant adjustments.
- Governance actions are onchain and timelocked, ensuring protocol rules cannot be changed abruptly.

This architecture retains Helix’s epistemic-market ethos, filters noise through economic costs, and keeps the system future-proof for the richer compression-enabled Helix main chain.
