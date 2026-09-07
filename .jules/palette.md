## 2026-02-08 - Dynamic Copy Feedback
**Learning:** Buttons that toggle state (like "Copy") fail accessibility if only visible text changes. Screen readers may not announce the update or will re-announce the stale `aria-label` on focus.
**Action:** Use conditional `aria-label` strings (e.g., "Copy address" vs "Address copied") and wrap changing text in `aria-live="polite"` for immediate feedback.
