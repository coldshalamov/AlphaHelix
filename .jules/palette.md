
## 2026-02-26 - Helper Buttons & Focus Management
**Learning:** Helper buttons (like 'Max') that modify input values programmatically should shift focus to the input field. This provides immediate context to keyboard/screen reader users that the value has changed and is ready for editing.
**Action:** When implementing helper buttons that modify an input, use `useRef` to focus the input after the value update.
