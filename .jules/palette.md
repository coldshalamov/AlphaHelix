## 2024-05-20 - Ensure form wrapping handles Enter key securely
**Learning:** Native form wrapping (to support Enter key submissions) on complex inputs like stakes/bets must be paired with properly disabled state logic within the onSubmit handler (e.g. `if (!isLocked) handleCommit()`) and explicit `type="button"` on internal max/helper buttons, to prevent unintentional early submissions.
**Action:** When wrapping standalone inputs in `<form>` elements for accessibility, ensure the submit button handles all states and non-submit buttons are explicitly typed.
## 2024-05-20 - Add aria-live to dynamic transaction statuses
**Learning:** Dynamic transaction status messages (like claim confirmations or errors) must include `aria-live="polite"` so screen reader users are notified when the state changes without needing to manually move focus to the status element.
**Action:** When adding transaction flows or dynamic feedback messages, ensure the container rendering the message includes the appropriate `aria-live` attribute.

## 2024-10-26 - [Web3 Proactive Form Validation]
**Learning:** Allowing users to submit Web3 forms with amounts exceeding their balance leads to frustrating wallet-level rejections (e.g., MetaMask 'insufficient funds' errors) which degrade the UX.
**Action:** Always proactively validate input amounts against available balances (e.g., `parseEther(amount) > balance`) and visually disable the submit button with clear inline feedback like "Insufficient ETH" to prevent invalid wallet interactions.
