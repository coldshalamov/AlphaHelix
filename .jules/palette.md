
## 2024-05-24 - Semantic Forms for Input Widgets
**Learning:** React elements wrapped in a generic `<div>` with a submit button using an `onClick` handler do not support native form submission via the 'Enter' key. This degrades keyboard accessibility for users.
**Action:** Always wrap input-heavy widgets in a semantic `<form onSubmit={...}>` and use a `<button type="submit">` to ensure users can submit data natively. Ensure nested buttons inside the form explicitly define `type="button"` to avoid accidental submission.
