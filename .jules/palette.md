# Palette's Journal

## 2024-05-22 - Reusable Copy Interaction Pattern
**Learning:** Copy interactions often lack accessible feedback for screen readers (static `aria-label` despite visual change).
**Action:** Create a reusable `CopyButton` component that uses `aria-live` to announce status changes and handles the transient "Copied!" state consistently.
