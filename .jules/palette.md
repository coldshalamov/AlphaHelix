## 2024-06-08 - Pagination Accessibility
**Learning:** Standalone text like "Previous" and "Next" lacks sufficient context for screen reader users when navigating pagination controls.
**Action:** Always add context-rich `aria-label` attributes (e.g., 'Previous page', 'Next page') to pagination controls, and wrap the container in a `<nav aria-label="Pagination">`. Also, explicitly set `type="button"` to avoid accidental form submissions if placed near forms.
