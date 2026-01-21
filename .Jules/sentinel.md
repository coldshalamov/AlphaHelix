## 2025-05-15 - Local Secret Fragility in Commit-Reveal
**Vulnerability:** User interface allowed re-committing to a market where a bet was already active, causing the locally stored secret (salt) for the original bet to be overwritten by a new one. Since the contract rejects the second commit, the user is left with a new (useless) secret and no way to reveal the original bet, leading to total fund loss.
**Learning:** In "local-first" secret management (storing salts in localStorage), the UI must strictly enforce the contract's state (e.g., `hasCommitted`) to prevent user actions that could corrupt local state. The "Overwrite -> Revert -> Cleanup" cycle is a dangerous pattern when state synchronization is laggy.
**Prevention:** Always pass on-chain status (`committedAmount` or `hasCommitted`) to stateful widgets and disable conflicting actions (like "Commit") at the rendering level, rather than relying solely on contract reverts.

## 2025-05-18 - CEI Violation in Trusted Token Transfers
**Vulnerability:** Smart contract functions `commitBet` and `_submitStatementInternal` performed external calls (`token.transferFrom`) *before* updating internal state (`commits`, `marketCount`). While mitigated by `ReentrancyGuard` and the trusted nature of the immutable `AlphaHelixToken`, this violated the Checks-Effects-Interactions (CEI) pattern, theoretically leaving the contract open to reentrancy if the token logic changed or if the guard was bypassed.
**Learning:** Even when using "trusted" components like standard ERC20s and ReentrancyGuards, strictly adhering to CEI provides a robust defense-in-depth layer that protects against future refactors or unexpected cross-contract interactions. It decouples security from specific dependencies.
**Prevention:** Always place external calls (interactions) at the very end of the function, after all state changes (effects) have been committed.

## 2025-05-21 - Privileged Burn Backdoor
**Vulnerability:** `AlphaHelixToken` contract contained a `burn(address from, uint256 amount)` function restricted only by `MINTER_ROLE`, allowing the role holder (likely admin/deployer) to burn arbitrary user tokens without allowance. This contradicts the decentralized nature of the application.
**Learning:** Custom implementation of standard features (like burning) often introduces security flaws or centralization risks compared to using battle-tested libraries (OpenZeppelin extensions).
**Prevention:** Utilize established extensions like `ERC20Burnable` which enforce standard security models (users burn their own tokens) instead of rolling custom logic that might be overly permissive.
