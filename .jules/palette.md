## 2024-05-24 - Semantic Form Labels & Status Feedback
**Learning:** `Bank.jsx` used `<p>` tags as visual labels without programmatic association, and duplicated status messages for transaction states.
**Action:** Always replace visual-only labels with `<label htmlFor="...">` linked to the input's `id`. Consolidate transaction feedback into a single `role="status"` container with `aria-live="polite"` to avoid double-speaking by screen readers.
