## 2024-05-24 - Input Fields and Scroll-jacking
**Learning:** Financial input fields should use `<input type="text" inputMode="decimal">` with the HTML `pattern` attribute to prevent scroll-jacking.
**Action:** Manually strip non-numeric characters in the `onChange` handler, and importantly, replace commas with dots to support international keyboards. When converting existing `type="number"` inputs, ensure number-specific attributes like `min` and `step` are removed.
