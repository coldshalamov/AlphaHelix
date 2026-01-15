## 2024-05-22 - Reusing Layout Patterns in Components
**Learning:** The `Layout` component established a "Click to Copy" badge pattern for the wallet address. This pattern was not reused in `Bank.jsx`, leading to inconsistency (full address vs truncated) and poorer UX (no copy). Reusing the exact pattern (including inline style overrides on `.badge`) improved consistency and usability.
**Action:** When improving component UX, check `Layout` or global headers for established interaction patterns to reuse.
