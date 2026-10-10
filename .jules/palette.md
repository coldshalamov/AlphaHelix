## 2024-05-20 - Ensure form wrapping handles Enter key securely
**Learning:** Native form wrapping (to support Enter key submissions) on complex inputs like stakes/bets must be paired with properly disabled state logic within the onSubmit handler (e.g. `if (!isLocked) handleCommit()`) and explicit `type="button"` on internal max/helper buttons, to prevent unintentional early submissions.
**Action:** When wrapping standalone inputs in `<form>` elements for accessibility, ensure the submit button handles all states and non-submit buttons are explicitly typed.
## 2024-05-20 - Add aria-live to dynamic transaction statuses
**Learning:** Dynamic transaction status messages (like claim confirmations or errors) must include `aria-live="polite"` so screen reader users are notified when the state changes without needing to manually move focus to the status element.
**Action:** When adding transaction flows or dynamic feedback messages, ensure the container rendering the message includes the appropriate `aria-live` attribute.
## 2024-05-20 - Dynamic aria-label and title for stateful utility buttons
**Learning:** Stateful utility buttons (like 'Copy' becoming 'Copied!') must use dynamic `aria-label` attributes to ensure screen readers accurately reflect the current state, as static `aria-label`s override dynamic inner text. Adding native `title` attributes also improves accessibility for mouse users by providing a hover tooltip.
**Action:** When creating utility buttons that visually change state based on user interaction, always ensure both `aria-label` and `title` attributes are dynamically updated alongside the inner content.
