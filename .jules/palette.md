## 2024-06-01 - Pagination Accessibility
**Learning:** Pagination controls with standalone text like "Previous" or "Next" lack sufficient context for screen reader users, and buttons lacking explicit `type="button"` can trigger accidental form submissions.
**Action:** Always add context-rich `aria-label` attributes (e.g., "Previous page", "Next page") and explicit `type="button"` to pagination controls.
