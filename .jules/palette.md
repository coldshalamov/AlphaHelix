## 2026-05-22 - Pagination Accessibility

**Learning:** Standalone text like "Previous" or "Next" lacks sufficient context for screen reader users, and buttons lacking explicit `type="button"` can trigger accidental form submissions.
**Action:** Always add context-rich `aria-label` attributes (e.g., "Previous page", "Next page") and `type="button"` to pagination controls.
