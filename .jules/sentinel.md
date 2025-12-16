# Sentinel's Security Journal

## 2025-12-13 - [Commitment Overwrite Vulnerability]
**Vulnerability:** `HelixMarket.sol` allowed users to overwrite their commitment hash and increase stake, effectively changing their vote during the commit phase by just adding more funds (even 1 wei).
**Learning:** Checking for `amount > 0` is not enough to prevent overwrites. Explicit state checks (`!hasCommitted`) are required for "one-time" actions.
**Prevention:** Always verify if a user has already performed an action if the protocol mandates a "single action" policy.

## 2025-12-13 - [Griefing Vulnerability (Short Reveal Duration)]
**Vulnerability:** `HelixMarket.sol` allowed creating markets with practically zero reveal duration, making it impossible for users to reveal bets, forcing them to withdraw with a penalty.
**Learning:** Documented protocol constraints (like "minimum 1 hour reveal") are not self-enforcing.
**Prevention:** Explicitly validate all user-supplied duration parameters against safe minimums in the contract logic.
