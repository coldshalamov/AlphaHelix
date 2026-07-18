## 2024-07-18 - Accessible Pagination Pattern
**Learning:** Found pagination components that lacked explicit `type="button"` and context-rich screen reader labels. More importantly, page transition updates were silent to screen readers without an `aria-live` region on the page indicator.
**Action:** Always apply `type="button"`, `aria-label`s for navigation intent, and `aria-live="polite"` on page indicator spans to ensure accessible page transitions across the app.
