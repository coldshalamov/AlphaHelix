# AGENT_CONTEXT.md

## Project Summary
Alpha Helix is a prediction market on Arbitrum using HLX tokens. It allows users to stake capital on the truth of statements. This "Alpha" version focuses on the economic primitive: a betting market where truth is determined by the weight of stake, incentivized by a winner-takes-all mechanism.

## Architecture
The system consists of three main components:
1.  **AlphaHelixToken (HLX):** The ERC20 token used for staking and betting.
2.  **HelixReserve:** A contract that acts as an exchange (faucet/sink) allowing users to buy HLX with ETH and sell HLX back for ETH.
3.  **HelixMarket:** The core prediction market contract. It handles statement creation, betting (Commit-Reveal), and resolution.

## Core Logic
*   **Commit-Reveal Scheme:** To prevent "sniping" (where whales bet at the last second to sway the outcome without risk), bets are first "committed" (hashed) during the bidding window. They are then "revealed" in a subsequent window. Only revealed bets count towards the final tally.
*   **Unaligned Pool:** Users can bet "Unaligned" if they want to participate but not pick a side (or if they believe the statement is malformed/undecidable, though in this version it acts as a pot sweetener).
*   **Winner Takes All:** The winning side (YES or NO) takes the entire pool of the losing side AND the Unaligned pool. This strongly incentivizes decisive betting on the perceived truth.
*   **Resolution:** The outcome is determined purely by which side has more revealed stake (YES vs NO). Ties result in a draw (logic may vary, but typically funds are returned or locked, in this implementation ties are handled explicitly).

## Contract Addresses
*   **AlphaHelixToken:** [Deploy Address Will Go Here]
*   **HelixReserve:** [Deploy Address Will Go Here]
*   **HelixMarket:** [Deploy Address Will Go Here]

## Directory Structure
*   `contracts/`
    *   `AlphaHelixToken.sol`: The ERC20 token.
    *   `HelixReserve.sol`: The ETH-HLX exchange.
    *   `HelixMarket.sol`: The prediction market logic.
*   `scripts/`
    *   `deploy.js`: Deployment script for all contracts.
*   `frontend/`
    *   `src/`
        *   `config/`
            *   `contracts.json`: Stores deployed addresses.
            *   `wagmi.js`: Wagmi/RainbowKit configuration.
        *   `components/`
            *   `Bank.jsx`: UI for buying/selling HLX.
            *   `MarketFeed.jsx`: UI for listing markets.
            *   `BettingWidget.jsx`: Complex UI for Commit-Reveal betting.
