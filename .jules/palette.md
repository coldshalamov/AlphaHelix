## 2024-03-12 - Shift Focus on Helper Actions
**Learning:** Helper buttons like "Max" that auto-populate an input value do not natively shift keyboard focus. This creates an accessibility gap where a screen reader user or keyboard user must manually navigate back to the input to verify the change or continue the form flow.
**Action:** Always attach a `useRef` to the target input and invoke `.current.focus()` within the helper button's click handler.
