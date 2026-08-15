## 2026-05-05 - Use Semantic Forms for Input Widgets
**Learning:** React component widgets relying on `<div>` wrappers and `onClick` handlers for submission prevent native keyboard accessibility, such as pressing "Enter" to submit.
**Action:** Always use semantic `<form onSubmit={...}>` wrappers and `<button type="submit">` for transaction/input widgets to enable native keyboard form submission.
