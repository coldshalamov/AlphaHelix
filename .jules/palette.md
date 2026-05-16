
## 2026-05-16 - Prevent scroll-jacking on financial inputs
**Learning:** Using `type="number"` on financial inputs causes scroll-jacking and unwanted behavior. `type="text"` with `inputMode="decimal"` and a regex pattern is more reliable.
**Action:** When updating inputs, replace commas with dots, remove non-numeric characters, and use `setSelectionRange` to preserve the cursor position when manually updating `e.target.value`.
