## 2024-05-22 - [Navigation Accessibility]
**Learning:** React Router / Next.js Links often rely solely on CSS classes for active states, leaving screen reader users unaware of their current location.
**Action:** Always include `aria-current="page"` on the active navigation item to provide semantic context alongside visual styling.

## 2024-05-24 - [Semantic Choice Patterns]
**Learning:** Users scan Yes/No options faster when they use semantic colors (Green/Red) rather than generic active/inactive states.
**Action:** Use `primary` (success) and `danger` variants for positive/negative boolean choices instead of generic toggle styles.
