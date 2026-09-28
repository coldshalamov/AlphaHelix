## 2024-05-20 - Ensure form wrapping handles Enter key securely
**Learning:** Native form wrapping (to support Enter key submissions) on complex inputs like stakes/bets must be paired with properly disabled state logic within the onSubmit handler (e.g. `if (!isLocked) handleCommit()`) and explicit `type="button"` on internal max/helper buttons, to prevent unintentional early submissions.
**Action:** When wrapping standalone inputs in `<form>` elements for accessibility, ensure the submit button handles all states and non-submit buttons are explicitly typed.
## 2024-05-20 - Inline Validation for Web3 Transactions
**Learning:** Users often attempt transactions with values exceeding their balances, leading to confusing and frustrating wallet-level rejections (like MetaMask "insufficient funds" errors). Web3 forms require inline validation prior to wallet interaction to ensure a smooth UX.
**Action:** Always implement inline balance validation and disable submit buttons with clear helper text (e.g., "Insufficient ETH") when an entered amount exceeds the connected wallet's available balance.
