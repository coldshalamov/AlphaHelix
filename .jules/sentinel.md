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

## 2024-05-26 - [CEI Violation in Conditional Branches]
**Vulnerability:** External calls (`token.transferFrom`, `token.burn`) inside conditional branches within `_submitStatementInternal` were executed before all state variables were fully updated, violating the Checks-Effects-Interactions (CEI) pattern. This could potentially allow for reentrancy attacks if the token contract was malicious or if the ReentrancyGuard was bypassed.
**Learning:** Even when external calls are seemingly safe (like burning tokens), adhering to CEI is crucial for robust smart contract security. When external calls are inside conditional branches, it's safer to calculate the required amounts locally and perform the external calls once at the very end of the function.
**Prevention:** Refactor external interactions embedded within conditional branches to calculate amounts locally (e.g., `uint256 burnAmount;`), deferring the actual external call until the very end of the function after all state changes.

## 2024-05-26 - [CI Failures: Deprecated Actions and Missing Output Files]
**Vulnerability:** CI pipelines failed due to using deprecated GitHub Actions (e.g., `actions/upload-artifact@v3` instead of `v4`) and because the gas report artifact was not being explicitly generated despite `REPORT_GAS=true`. This causes pipelines to break, potentially blocking critical security updates or deployments.
**Learning:** Hard failures in CI must be addressed as priority to maintain a secure and functional development lifecycle. `REPORT_GAS=true npm test` does not automatically create a `gas-report.txt` file by default; the output must be explicitly piped using `tee` (e.g., `REPORT_GAS=true npm test | tee gas-report.txt`) for the runner to access it in subsequent steps. Additionally, `actions/github-script` should be updated to `v7` to avoid Node.js deprecation warnings/failures.
**Prevention:** Always ensure CI workflows are kept up-to-date with the latest major action versions (v4 for standard actions, v7 for scripts). When relying on CLI output to generate reports, explicitly pipe and save the output.

## 2024-05-26 - [GitHub Actions Permission Failure]
**Vulnerability:** The gas report job failed with `HttpError: Resource not accessible by integration` (status 403) when trying to comment on the PR.
**Learning:** GitHub Actions jobs that need to comment on PRs (like `actions/github-script` making API calls) must have explicit `permissions` granted to them, such as `pull-requests: write` and `issues: write`, especially if the repository defaults to restricted token permissions.
**Prevention:** Always verify and add the necessary `permissions` block to workflows or specific jobs that interact with GitHub APIs.
