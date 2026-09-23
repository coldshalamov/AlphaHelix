## 2024-05-23 - Convert Commit Div to Form
**Learning:** In the Helix codebase, `<div>` containers acting as forms break native keyboard accessibility (submitting via Enter key). When converting them to `<form>`, it is critical to ensure inner buttons have `type="button"` and the `onSubmit` handler checks for locked/disabled states to prevent unauthorized submissions via Enter.
**Action:** Always use semantic `<form>` tags for inputs, verify button types, and enforce disabled logic in the submit handler.
