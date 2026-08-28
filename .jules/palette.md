## 2026-04-05 - Prevent scroll-jacking on financial inputs
**Learning:** Financial input fields using type='number' cause scroll-jacking on desktop and present numeric keyboards on mobile without allowing decimal input easily. This negatively impacts UX and accessibility.
**Action:** Use type='text' with inputMode='decimal' and a regex pattern to allow numeric input without scroll-jacking, while manually stripping invalid characters in the onChange handler.
