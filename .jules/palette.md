## 2024-07-06 - Pagination Accessibility
**Learning:** React pagination controls using standard semantic `<div>` or `<span>` wrappers without `type="button"` and context-rich `aria-labels` often trap screen reader users or cause accidental form submissions when nested.
**Action:** Always add `type="button"`, `aria-label="[Context]"`, and `aria-live="polite"` regions to pagination components to ensure robust keyboard and screen reader support.
