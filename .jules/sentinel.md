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

## 2024-05-26 - [Address Grinding in Randomness]
**Vulnerability:** Including `msg.sender` in the entropy source for `checkRandomClose` allows attackers to manipulate the outcome by generating multiple addresses offline (Address Grinding) and submitting the transaction from the one that produces a favorable hash.
**Learning:** `msg.sender` is cheap to generate and user-controlled. When used in randomness generation for critical state transitions (like closing a market), it breaks the assumption of unpredictability. Removing it forces the user to rely on shared block properties (`blockhash`, `prevrandao`) which are much harder to manipulate for a specific outcome without mining power.
**Prevention:** Exclude `msg.sender` from any on-chain randomness calculation where the user benefits from influencing the result. Rely on block-level entropy (`prevrandao`, `blockhash`) and shared state.
