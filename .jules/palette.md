## 2026-04-20 - Financial Input Accessibility
**Learning:** Using type="number" for financial inputs causes scroll-jacking and breaks on international keyboards that use commas for decimals.
**Action:** Use type="text" with inputMode="decimal" and manual sanitization (replacing commas with dots and stripping non-numeric chars) in onChange handlers.
