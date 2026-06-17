## 2026-04-29 - Prevent scroll-jacking on financial inputs
**Learning:** Using `type="number"` on financial inputs causes scroll-jacking and usability issues. Additionally, strict regex validation might break on international keyboards that use commas instead of dots.
**Action:** Use `type="text"` with `inputMode="decimal"` and `pattern="^\d*\.?\d*$"`. In the onChange handler, manually strip non-numeric characters and replace commas with dots (e.g., `val.replace(/,/g, '.').replace(/[^\d.]/g, '')`). Remove number-specific attributes like `min` and `step`.
