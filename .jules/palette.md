## 2024-05-24 - Financial Input Validation
**Learning:** Browser native `<input type="number">` is problematic for financial data because:
1. Scroll wheel changes values accidentally (often unnoticed by users).
2. Up/down arrow keys change values.
3. `maxLength` attribute is often ignored.
4. Formatting (commas, decimals) varies by locale and browser.

**Action:** Use `<input type="text" inputMode="decimal">` with explicit regex validation (e.g., `/^\d*\.?\d*$/`) for all currency inputs. This provides a consistent experience, prevents accidental changes, and allows precise control over formatting and length.
