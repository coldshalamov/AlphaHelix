## 2026-07-11 - [Improved Pagination Accessibility]
**Learning:** Screen readers don't announce page transitions on custom pagination controls automatically, and pagination buttons without type="button" could accidentally trigger form submissions
**Action:** Added `aria-live="polite"` to the pagination indicator and explicit `type="button"` and `aria-label`s to the Previous/Next buttons
