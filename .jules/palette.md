## 2026-01-16 - Helper Button Focus Management
**Learning:** Helper buttons (like 'Max') that modify an input's value should transfer focus to that input field immediately after action.
**Action:** When implementing helper buttons, use `useRef` to programmatically focus the target input in the click handler. This allows keyboard users to immediately edit the value and provides context for screen readers.
