## 2024-04-13 - Financial Input Scroll-Jacking & Internationalization
**Learning:** Using `<input type="number">` for financial inputs causes accessibility issues like scroll-jacking, and fails to support international keyboards which use commas for decimals.
**Action:** Use `<input type="text" inputMode="decimal" pattern="^\d*\.?\d*$">` instead, explicitly strip non-numeric characters, and replace commas with dots in the `onChange` handler to fully support i18n while preventing unwanted scrolling behavior.
