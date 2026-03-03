## 2024-05-24 - Explicit Focus Management for Helper Buttons
**Learning:** Helper buttons that auto-fill or modify input values (like "Max" balance buttons) cause screen reader and keyboard users to lose context because the value changes but their focus remains on the button.
**Action:** Always implement a `useRef` to explicitly shift focus (`ref.current?.focus()`) to the modified input field immediately after the helper button's action completes. This ensures immediate feedback and keeps the user in the correct interactive flow.
