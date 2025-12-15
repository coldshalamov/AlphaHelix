# Sentinel's Security Journal

## 2025-12-13 - [Commitment Overwrite Vulnerability]
**Vulnerability:** `HelixMarket.sol` allowed users to overwrite their commitment hash and increase stake, effectively changing their vote during the commit phase by just adding more funds (even 1 wei).
**Learning:** Checking for `amount > 0` is not enough to prevent overwrites. Explicit state checks (`!hasCommitted`) are required for "one-time" actions.
**Prevention:** Always verify if a user has already performed an action if the protocol mandates a "single action" policy.

## 2025-12-14 - [Reveal Duration Griefing]
**Vulnerability:** A malicious market creator could set `revealDuration` to 0 (or very short). Users who committed bets would be unable to reveal in time (because `block.timestamp` would immediately exceed `revealEndTime`). This trapped their funds, forcing them to use `withdrawUnrevealed` and suffer the 1% burn penalty.
**Learning:** Time-based phases must have minimum durations to ensure human/network feasibility. "Zero duration" logic can pass `start < end` checks but fail practical execution.
**Prevention:** Enforce minimum durations (e.g., `1 hours`) for critical protocol phases to prevent griefing attacks.
