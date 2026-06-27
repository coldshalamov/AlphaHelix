## 2024-06-27 - Pagination Context Accessibility
**Learning:** Standalone text like 'Previous' or 'Next' lacks sufficient context for screen reader users on pagination controls, and missing type="button" can trigger accidental form submissions if wrapped in a form.
**Action:** Always add context-rich aria-label attributes (e.g., 'Previous page') and explicit type="button" to pagination controls.
