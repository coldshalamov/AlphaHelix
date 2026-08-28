## 2024-05-23 - [Secret Binding to Sender]
**Vulnerability:** Local storage of commit-reveal secrets (salt) is typically vulnerable to XSS/physical access, allowing attackers to steal the salt and potentially manipulate the reveal phase.
**Learning:** In `HelixMarket.sol`, the commit hash is `keccak256(choice, salt, msg.sender)`. The inclusion of `msg.sender` in the hash means that even if an attacker steals the salt from `localStorage`, they cannot submit a valid `revealBet` transaction unless they *also* compromise the user's private key (to sign the transaction as `msg.sender`). This effectively neutralizes the risk of stolen salts being used to front-run or reveal on behalf of the user, although privacy (knowing the vote) is still compromised.
**Prevention:** Always bind secrets to the user's identity (`msg.sender` or signature) in the on-chain verification logic to prevent replay or stolen-credential attacks.

## 2024-05-24 - [Randomness Manipulation via Gas Price]
**Vulnerability:** `HelixMarket.sol` used `tx.gasprice` as an entropy source for `checkRandomClose`. This allowed users to grind gas prices (simulating transactions with different fees) to force a market close at a time favorable to them, effectively bypassing the uncertainty of "Random Close".
**Learning:** `tx.gasprice` is completely user-controllable (above base fee) and should never be used for on-chain randomness or critical logic. `block.prevrandao` (on L1/PoS) or L2-specific randomness (like Arbitrum's batch-derived prevrandao) provides much better resistance to manipulation by the transaction sender.
**Prevention:** Remove user-controllable fields like `tx.gasprice` from entropy sources. Use `block.prevrandao` for on-chain randomness where Oracles are not permitted.

## 2024-05-25 - [Native Burn vs Dead Address]
**Vulnerability:** Sending tokens to `0x...dEaD` removes them from circulation effectively but fails to update the `totalSupply` metric, potentially leading to incorrect market capitalization data and accounting discrepancies.
**Learning:** When using burnable tokens (ERC20Burnable), `token.transfer(dEaD, amount)` is an anti-pattern. The contract holding the tokens should call `token.burn(amount)` to correctly decrease `totalSupply`. This requires the holding contract to have ownership of the tokens (which it does in `HelixMarket` after `transferFrom`).
**Prevention:** Always prefer native `burn()` functions over transferring to dead addresses to ensure on-chain metrics reflect the true state of the economy.

## 2025-05-22 - Revert Loop Vulnerability in Pre-execution Modifiers
**Vulnerability:** The `checkRandomClose` modifier performed an external call (`token.transfer`) before the function body. If the external call failed (e.g., due to insufficient balance or token logic), the entire transaction would revert, permanently blocking core functionalities (`commitBet`, `revealBet`) from executing. This is a severe Denial-of-Service (DoS) vector.
**Learning:** External calls inside `modifier`s violate the Checks-Effects-Interactions (CEI) pattern and create brittle pre-conditions that can brick a contract if the external call reverts.
**Prevention:** Always refactor state-changing or external-calling modifiers into internal functions. Return a boolean flag (e.g., `triggerPingReward`) and handle the external call at the very end of the main function body to ensure core logic executes first and safely.

## 2025-05-22 - [CEI Violation in Conditional Branches]
**Vulnerability:** External calls like `token.transferFrom` and `token.burn` inside a conditional branch execution prior to state changes or event emissions violates the Checks-Effects-Interactions (CEI) pattern. If the transfer fails or is subjected to reentrancy, it might lead to unexpected states or partial transaction executions.
**Learning:** Even when operations apply to different tokens or seemingly isolated scopes, any external calls within conditional branches should be refactored to first compute local variables (e.g., `uint256 burnAmount;`). Then, the function should execute state modifications and event emissions. Finally, the external interactions should be performed using those calculated parameters at the very end.
**Prevention:** Calculate the amount for external operations locally. Delay the actual external calls (like `transferFrom` or `burn`) until after all checks and effects (including state updates and `emit`ing events) have occurred, moving them to the end of the function.
