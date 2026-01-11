## 2026-01-09 - Commit-Reveal Data Race
**Vulnerability:** `localStorage` persistence of commit salts occurred *after* transaction confirmation.
**Learning:** Users could lose funds (100% penalty) if the browser crashed/closed between transaction submission and confirmation, as the reveal secret would be lost.
**Prevention:** Always persist critical secrets (salts, keys) *before* initiating the irreversible on-chain action.
