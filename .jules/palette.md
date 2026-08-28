## 2024-06-09 - Accessible Form Submission

**Learning:** When building custom betting widgets or inputs inside React components, wrapping inputs and submit buttons within a `<div>` and relying purely on an `onClick` handler prevents native keyboard submission (pressing 'Enter').
**Action:** Always wrap interactive input flows within a semantic `<form>` and bind the action to `onSubmit`. Ensure the primary action button has `type="submit"` rather than an `onClick` handler to natively support screen reader form submissions and keyboard users.
