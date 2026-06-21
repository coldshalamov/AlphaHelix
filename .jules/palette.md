## 2024-06-21 - Form Accessibility Pattern
**Learning:** In the `BettingWidget` and potentially other frontend components, inputs and submit buttons were initially grouped using `<div>` wrappers and `onClick` handlers. This prevents native form submission via the "Enter" key, which is a key keyboard accessibility standard.
**Action:** Always wrap input-heavy widgets in a semantic `<form onSubmit={...}>` and use a primary `<button type="submit">` to restore native keyboard accessibility without changing visual styling.
