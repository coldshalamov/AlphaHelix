## 2024-10-03 - Reentrancy via External Transfer in `_submitStatementInternal`
**Vulnerability:** A reentrancy vulnerability existed in `HelixMarket._submitStatementInternal` where `token.transferFrom` and `token.transfer` were called before critical market state initialization (like `marketId` increment and `s.commitEndTime` assignment). While the token is assumed to be trusted, if a malicious ERC20 token or hook was involved, an attacker could potentially reenter and corrupt market initialization.
**Learning:** Violating the Checks-Effects-Interactions (CEI) pattern during complex object initialization is dangerous. Even with benign tokens, the state should be fully committed before making external calls to ensure state integrity.
**Prevention:** Always follow the Checks-Effects-Interactions pattern. Perform all state modifications (`marketCount++`, storage updates) before making external token transfers.

## 2024-10-03 - Strict Equality in Timestamp Comparison `pingMarket`
**Vulnerability:** A logic issue existed in `HelixMarket.pingMarket` where a strict equality comparison `s.commitPhaseClosed == block.timestamp` could lead to unpredictable results or bypasses, particularly when block timestamps might not precisely match execution states.
**Learning:** Avoid strict equality checks against `block.timestamp` as they can be highly unreliable or easily bypassed due to minor block timing variances.
**Prevention:** Prefer range checks (>, <, >=, <=) or more robust state flags rather than strict timestamp equalities for determining phase transitions.
