## 2026-04-19 - Prevent Scroll-jacking and Support International Keyboards in Financial Inputs
**Learning:** Native type="number" inputs cause scroll-jacking on financial values and fail to support comma decimals for international keyboards.
**Action:** Use <input type="text" inputMode="decimal" pattern="^\d*\.?\d*$"> instead, and manually replace commas with dots in the onChange handler while stripping non-numeric characters.
