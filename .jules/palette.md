## 2026-05-26 - Context-rich Pagination Controls
**Learning:** Standalone text like "Previous" or "Next" lacks sufficient context for screen reader users, and buttons lacking explicit `type="button"` can trigger accidental form submissions if ever wrapped in a form.
**Action:** Always add context-rich `aria-label` attributes (e.g., 'Previous page', 'Next page') to pagination controls, ensure `type="button"` is set, and use `aria-current="page"` for the current page indicator.
