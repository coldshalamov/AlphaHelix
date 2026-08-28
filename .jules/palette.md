## 2025-02-18 - Pagination Accessibility
**Learning:** Screen readers need `aria-live="polite"` on dynamic pagination text (e.g., "Page 1 of 5") to announce changes without interrupting the user. Pagination controls also need `aria-label` attributes and explicit `type="button"` attributes to provide context and prevent accidental form submissions.
**Action:** Always add context-rich `aria-label` attributes and explicit `type="button"` attributes to pagination controls, and add `aria-live="polite"` to the page indicator element when implementing pagination.
