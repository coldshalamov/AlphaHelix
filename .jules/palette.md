
## 2026-05-18 - Fix Financial Input Scroll-Jacking & React Desync
**Learning:** Using `<input type="number">` for financial inputs causes scroll-jacking. Changing to `type="text"` requires manual sanitization in `onChange` to replace commas, remove non-numeric chars, and merge decimals. Crucially, updating `e.target.value` manually to prevent React state desync resets the cursor position, necessitating manual preservation using `selectionStart`/`selectionEnd`.
**Action:** Always use `<input type="text" inputMode="decimal" pattern={"^\\d*\\.?\\d*$"}>` for financial fields and manually sanitize while preserving selection range during forced DOM updates.
