
## 2026-05-07 - Native Keyboard Accessibility for Inputs
**Learning:** Financial input widgets that use `<div>` wrappers and `onClick` handlers on buttons prevent native keyboard submission (pressing "Enter"). This breaks a core expectation for forms and reduces accessibility.
**Action:** Always wrap interactive input fields in semantic `<form onSubmit={...}>` tags and use `<button type="submit">` to ensure native keyboard workflows are supported.
