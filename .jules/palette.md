## 2024-07-07 - Client-side Pagination Screen Reader Interruptions
**Learning:** Client-side pagination in React fails to announce page changes to screen readers because there is no page reload.
**Action:** Always add `aria-live="polite"` to the page indicator element (e.g., `Page X of Y`) and wrap controls in a semantic `<nav>` so transitions are announced smoothly.
