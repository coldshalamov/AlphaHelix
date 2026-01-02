# Sentinel's Security Journal

## 2025-12-13 - [Commitment Overwrite Vulnerability]
**Vulnerability:** `HelixMarket.sol` allowed users to overwrite their commitment hash and increase stake, effectively changing their vote during the commit phase by just adding more funds (even 1 wei).
**Learning:** Checking for `amount > 0` is not enough to prevent overwrites. Explicit state checks (`!hasCommitted`) are required for "one-time" actions.
**Prevention:** Always verify if a user has already performed an action if the protocol mandates a "single action" policy.

## 2025-05-18 - [Griefing via Short Reveal Duration]
**Vulnerability:** `HelixMarket.sol` allowed creating markets with extremely short reveal durations (e.g., 1 second). This enabled griefing attacks where users commit funds but cannot physically reveal them in time, forcing them to forfeit their stake or pay penalties.
**Learning:** Configurable time parameters in smart contracts must have safety bounds (minimums/maximums) to prevent abuse, even if the "admin" or "originator" is trusted or incentivized.
**Prevention:** Enforce strict minimum duration constants (e.g., `MIN_REVEAL_DURATION`) for all time-sensitive phases.

## 2025-06-19 - [Griefing via Short Bidding Duration]
**Vulnerability:** `HelixMarket.sol` allowed creating markets with extremely short bidding durations (e.g., 1 second). This enabled creating "dead" markets where no one could participate (as the commit phase would close almost immediately), wasting fees and spamming the system.
**Learning:** All time-based parameters controlled by users must have protocol-enforced minimums to ensure viability and prevent spam/griefing.
**Prevention:** Enforce `MIN_BIDDING_DURATION` alongside `MIN_REVEAL_DURATION`.
