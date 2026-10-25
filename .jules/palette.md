## 2024-05-20 - Ensure form wrapping handles Enter key securely
**Learning:** Native form wrapping (to support Enter key submissions) on complex inputs like stakes/bets must be paired with properly disabled state logic within the onSubmit handler (e.g. `if (!isLocked) handleCommit()`) and explicit `type="button"` on internal max/helper buttons, to prevent unintentional early submissions.
**Action:** When wrapping standalone inputs in `<form>` elements for accessibility, ensure the submit button handles all states and non-submit buttons are explicitly typed.
## 2024-05-20 - Add aria-live to dynamic transaction statuses
**Learning:** Dynamic transaction status messages (like claim confirmations or errors) must include `aria-live="polite"` so screen reader users are notified when the state changes without needing to manually move focus to the status element.
**Action:** When adding transaction flows or dynamic feedback messages, ensure the container rendering the message includes the appropriate `aria-live` attribute.
## 2024-10-06 - Proactive inline balance validation
**Learning:** Web3 forms should proactively validate input amounts against available balances and visually disable submit buttons with clear helper text prior to wallet interaction to prevent frustrating wallet-level rejections (e.g. MetaMask "insufficient funds").
**Action:** When creating Web3 forms for token amounts, parse the input and verify it is <= the user's available balance to disable the submit button early.
