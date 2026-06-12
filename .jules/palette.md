## 2024-06-12 - Form Submission Accessibility Pattern
**Learning:** React input widgets using `<div>` wrappers and `onClick` handlers prevent native 'Enter' key form submission, breaking a core keyboard accessibility expectation for users.
**Action:** Always wrap input-heavy widgets in a semantic `<form onSubmit={...}>` with `e.preventDefault()` and use a primary `<button type="submit">` instead of `onClick`.
