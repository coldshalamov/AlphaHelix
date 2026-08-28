## 2024-06-29 - Improve pagination accessibility
**Learning:** Generic text like "Previous" and "Next" on pagination buttons lacks sufficient context for screen reader users traversing the page. Furthermore, pagination buttons often lack explicit `type="button"` attributes, which can inadvertently trigger form submissions if the pagination controls are ever nested within a `<form>` element during future refactoring.
**Action:** Always add context-rich `aria-label` attributes (e.g., "Previous page", "Next page") and explicit `type="button"` attributes to pagination controls.
