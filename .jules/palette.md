## 2024-07-12 - Pagination Accessibility
**Learning:** Pagination controls (like previous/next buttons) need semantic `<nav>` wrappers and explicit `type="button"` to avoid defaulting to `type="submit"` within broader forms. Also, page indicators benefit from `aria-live="polite"` so screen readers announce page transitions.
**Action:** Always wrap pagination buttons in a `<nav aria-label="Pagination navigation">`, add `type="button"`, and include `aria-live="polite"` on the page status indicator.
