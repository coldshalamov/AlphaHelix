## 2026-04-26 - Native Keyboard Submission for Financial Inputs
**Learning:** Using `<div>` wrappers and `onClick` handlers for financial inputs breaks native keyboard accessibility, preventing users from submitting via the 'Enter' key.
**Action:** Always wrap input widgets in semantic `<form onSubmit={...}>` tags and use `<button type="submit">` to ensure smooth keyboard interactions.
