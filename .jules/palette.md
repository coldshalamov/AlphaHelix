# Palette's Journal

This log records critical UX and accessibility learnings from the Alpha Helix project.

## 2024-05-23 - Form Interaction Feedback
**Learning:** Disabled submit buttons prevent users from discovering why a form is invalid, leading to frustration.
**Action:** Keep submit buttons enabled (except when loading) and provide specific, accessible error feedback on click.

## 2024-05-24 - Semantic Form Labels & Status Feedback
**Learning:** `Bank.jsx` used `<p>` tags as visual labels without programmatic association, and duplicated status messages for transaction states.
**Action:** Always replace visual-only labels with `<label htmlFor="...">` linked to the input's `id`. Consolidate transaction feedback into a single `role="status"` container with `aria-live="polite"` to avoid double-speaking by screen readers.

## 2024-05-25 - Multi-step Transaction Feedback
**Learning:** Generic "Loading..." or "Submitting..." text during multi-step blockchain transactions (Approve -> Commit) creates uncertainty about the actual progress.
**Action:** Use dynamic button labels to reflect the specific active stage (e.g., "Approving...", "Committing...") and disable all related form inputs during the process to prevent race conditions.
