## 2024-05-24 - Native Keyboard Submission for Forms
**Learning:** Users expect native keyboard submission (pressing 'Enter') for input-heavy widgets like the betting amount, which fails when using `<div>` wrappers and `onClick` handlers.
**Action:** Always wrap input fields and their submission actions in a semantic `<form onSubmit={...}>` and use `<button type="submit">`, ensuring to prevent defaults and validate disabled states within the handler.
