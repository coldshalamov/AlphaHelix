# Sentinel's Security Journal

## 2025-12-13 - [Commitment Overwrite Vulnerability]
**Vulnerability:** `HelixMarket.sol` allowed users to overwrite their commitment hash and increase stake, effectively changing their vote during the commit phase by just adding more funds (even 1 wei).
**Learning:** Checking for `amount > 0` is not enough to prevent overwrites. Explicit state checks (`!hasCommitted`) are required for "one-time" actions.
**Prevention:** Always verify if a user has already performed an action if the protocol mandates a "single action" policy.
