
## 2024-06-15 - Pagination Accessibility
**Learning:** Standalone text like 'Previous' or 'Next' lacks sufficient context for screen reader users, and pagination buttons without explicit `type="button"` can unintentionally trigger form submissions.
**Action:** Always add context-rich `aria-label` attributes (e.g., 'Previous page', 'Next page') to pagination controls, and explicitly declare `type="button"` for these buttons.
