## 2024-06-02 - Pagination Accessibility Context
**Learning:** Standalone pagination buttons with text like 'Previous' or 'Next' lack sufficient context for screen reader users, and buttons lacking explicit `type="button"` can trigger accidental form submissions.
**Action:** Always add context-rich `aria-label` attributes (e.g., 'Previous page', 'Next page') to pagination controls and ensure explicit `type="button"` declarations.
