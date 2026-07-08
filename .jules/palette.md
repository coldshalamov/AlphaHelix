## 2024-07-08 - Added semantic accessibility to market pagination
**Learning:** Found that `<nav aria-label="Pagination">` and explicit `type="button"` attributes inside Next.js components improve accessibility navigation for multi-page data listings. When pagination updates state, appending `aria-live="polite"` helps announce transitions implicitly.
**Action:** Always wrap pagination controls with semantic HTML (`<nav>`) and include proper ARIA and descriptive button labels instead of relying solely on `<div>` structures.
