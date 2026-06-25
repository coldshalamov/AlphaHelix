
## 2024-06-25 - Form Submission Accessibility
**Learning:** Using `<div>` wrappers and `onClick` handlers for input forms prevents native form submission via the 'Enter' key, a major pitfall in heavily state-driven widgets that degrades keyboard accessibility.
**Action:** Always wrap input-heavy widgets in a semantic `<form onSubmit={...}>` and use `<button type="submit">`, while ensuring auxiliary buttons explicitly use `type="button"`.
