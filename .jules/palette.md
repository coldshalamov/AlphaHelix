## 2026-05-14 - Form wrappers for inputs
**Learning:** Wrapping complex interactive state components (like the betting widget) in `\<form\>` tags natively enables implicit form submission via the "Enter" key on inputs, which is a significant quality of life improvement for keyboard power-users and enhances standard a11y expectations.
**Action:** Always wrap standard actionable inputs with `\<form\>` elements and use `type="submit"` on the primary action button to ensure keyboard usability is preserved.
