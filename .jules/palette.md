## 2024-07-05 - Pagination Accessibility
**Learning:** Screen readers require explicit context for pagination controls. Bare buttons saying "Previous" or "Next" lack sufficient context when read out of order. Additionally, dynamically updating page numbers must be announced to users as they interact with the controls.
**Action:** Always wrap pagination in a `<nav aria-label="Pagination">`, add explicit `aria-label`s like "Previous page" to the buttons, use `type="button"` to prevent accidental form submissions, and add `aria-live="polite"` to the page counter text so updates are announced.
