## 2026-04-03 - Prevent scroll-jacking on financial inputs
**Learning:** Financial input fields using type='number' are prone to scroll-jacking.
**Action:** Use type='text' with inputMode='decimal' and pattern='^\d*\.?\d*$' for accessibility and UX, manually stripping non-numeric characters in the onChange handler.
