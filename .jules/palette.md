# Palette's Journal

This log records critical UX and accessibility learnings from the Alpha Helix project.

## 2024-05-23 - Form Interaction Feedback
**Learning:** Disabled submit buttons prevent users from discovering why a form is invalid, leading to frustration.
**Action:** Keep submit buttons enabled (except when loading) and provide specific, accessible error feedback on click.

## 2024-05-24 - Semantic Form Labels & Status Feedback
**Learning:** `Bank.jsx` used `<p>` tags as visual labels without programmatic association, and duplicated status messages for transaction states.
**Action:** Always replace visual-only labels with `<label htmlFor="...">` linked to the input's `id`. Consolidate transaction feedback into a single `role="status"` container with `aria-live="polite"` to avoid double-speaking by screen readers.

## 2024-05-25 - Custom Radio Button State
**Learning:** Custom radio buttons (styled labels wrapping hidden inputs) do not automatically inherit disabled styling or behavior when the input is disabled.
**Action:** Explicitly apply visual disabled states (opacity, cursor) and `pointer-events: none` to the wrapper label when the underlying input is disabled.
