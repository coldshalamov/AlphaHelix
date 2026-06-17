## 2024-06-17 - Keyboard Accessibility for Input Widgets
**Learning:** Avoid using `<div>` wrappers and `onClick` handlers for input forms, as this prevents native form submission via the 'Enter' key.
**Action:** Always wrap input-heavy widgets in a semantic `<form onSubmit={...}>` and use a primary `<button type="submit">`.
