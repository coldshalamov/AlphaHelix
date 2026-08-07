## 2026-02-07 - Dynamic ARIA Feedback for State Changes
**Learning:** Copy buttons often rely on visual text changes (e.g., "Copy" -> "Copied!") which screen readers miss without explicit `aria-live` regions or label updates.
**Action:** Use `aria-live="polite"` on the button itself for simple text toggles, and dynamically update `aria-label` to ensure the new state is announced clearly (e.g., "Address copied to clipboard" instead of just "Copied!").
