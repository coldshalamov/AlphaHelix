
## 2025-03-01 - Auto-focus Modified Input Fields
**Learning:** Helper buttons (like "Max" value fillers) that modify input field values can create a disjointed experience, particularly for keyboard and screen reader users, if focus remains on the button after the field's value changes.
**Action:** When implementing buttons that programmatically fill or modify an input field, explicitly shift focus to that input field using `useRef` and `.focus()` to provide immediate feedback and streamline the interaction flow.
