
## 2026-05-19 - Prevent Scroll-jacking in Financial Inputs
**Learning:** Financial input fields utilizing `<input type="number">` suffer from scroll-jacking issues when users use the mouse wheel over them, altering values unintentionally. However, simply switching to `type="text"` introduces validation complexity.
**Action:** Use `<input type="text" inputMode="decimal" pattern="^\\d*\\.?\\d*$">` instead of `type="number"`. Manually sanitize values in the `onChange` handler by replacing commas with dots, removing invalid characters, and stripping extra dots. Crucially, when forcing a DOM update via `e.target.value = val` to avoid React state desynchronization, manually preserve the cursor position by storing `selectionStart`/`selectionEnd` and using `setSelectionRange()` after the update.
