
## 2024-05-17 - Keyboard Accessibility via Form Conversion
**Learning:** When using input-heavy widgets in React components, relying on `onClick` handlers for submission breaks native keyboard accessibility (like pressing 'Enter' in an input field). The form element provides this behavior natively.
**Action:** Convert `<div className="grid">` wrappers containing inputs and submit buttons to `<form onSubmit={...}>` and use `<button type="submit">`. Explicitly check for `disabled` states in the `onSubmit` handler to prevent users from bypassing disabled submit buttons via the 'Enter' key. Ensure all other internal `<button>` elements have `type="button"`.
