## 2024-05-23 - Form Interaction Feedback
**Learning:** Disabled submit buttons prevent users from discovering why a form is invalid, leading to frustration.
**Action:** Keep submit buttons enabled (except when loading) and provide specific, accessible error feedback on click.

## 2024-05-24 - Semantic Form Labels & Status Feedback
**Learning:** `Bank.jsx` used `<p>` tags as visual labels without programmatic association, and duplicated status messages for transaction states.
**Action:** Always replace visual-only labels with `<label htmlFor="...">` linked to the input's `id`. Consolidate transaction feedback into a single `role="status"` container with `aria-live="polite"` to avoid double-speaking by screen readers.

## 2024-05-24 - Input Validation Feedback
**Learning:** Generic status messages are helpful, but direct visual feedback on the input (like `aria-invalid` and error styling) significantly improves correction speed.
**Action:** Bind validation state directly to input attributes (`aria-invalid`) and styles to guide the user's eye to the error source immediately.
