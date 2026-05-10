## 2026-05-10 - Native Form Submission for Financial Widgets
**Learning:** Financial or transaction input widgets without a semantic `<form>` wrapper break native keyboard accessibility, preventing users from submitting transactions using the 'Enter' key.
**Action:** Always wrap interactive input fields and their primary submission buttons in a semantic `<form onSubmit={...}>` and use `<button type="submit">` instead of `<div>` wrappers and `onClick` handlers.
