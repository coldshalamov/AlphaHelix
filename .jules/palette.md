## 2024-06-13 - Enable Native Form Submission for Inputs
**Learning:** Using generic `<div>` wrappers and `onClick` handlers on buttons prevents users from submitting forms using the 'Enter' key.
**Action:** Always wrap input-heavy widgets in a semantic `<form onSubmit={...}>` and use a primary `<button type="submit">` to improve keyboard accessibility.
