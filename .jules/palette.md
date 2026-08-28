## 2026-05-24 - Pagination Accessibility
**Learning:** Always add context-rich `aria-label` attributes to pagination controls (e.g., 'Previous page', 'Next page'), as standalone text lacks context for screen reader users. Additionally, buttons lacking explicit `type="button"` can trigger accidental form submissions.
**Action:** Add `aria-label` and `type="button"` to pagination controls to improve accessibility and prevent unintended behavior.
