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

## 2024-05-26 - [Reverting State Transition]
**Vulnerability:** In `HelixMarket.sol`, the `checkRandomClose` modifier updates `s.commitPhaseClosed` to the current `block.timestamp` when a random close is triggered. However, the modified function (`commitBet`) subsequently checked `require(s.commitPhaseClosed == 0)`, causing the transaction that successfully closed the market to revert. This created a catch-22 where the market could never close via `commitBet` because the closing condition itself caused a failure.
**Learning:** When a modifier or internal logic triggers a state transition (Open -> Closed), the function must explicitly account for the *new* state if the transition happened in the current transaction/block. A check like `require(state == OPEN)` is insufficient if the state can transition to `CLOSED` *during* execution.
**Prevention:** Allow execution in the transitional state (e.g., `require(state == OPEN || state == JUST_CLOSED)`) or structure checks to occur before the state-modifying logic if possible (though modifiers run before body).
