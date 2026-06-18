## 2024-05-23 - Semantic Lists for Key-Value Displays
**Learning:** The app used a recurring `div.table-like` pattern for key-value pairs (e.g., market details, bank info) which lacked semantic association for screen readers. Replacing these with `dl/dt/dd` elements provides proper accessibility semantics.
**Action:** When refactoring to `dl`, ensure `dd` elements have `margin: 0` explicitly set (or handled via global CSS) to match the visual layout of the original `div` structures.
