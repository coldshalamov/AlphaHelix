## 2026-01-19 - [React.memo breaks with Object Props]
**Learning:** `React.memo` is ineffective when components receive object props derived from fresh parent state (e.g. `useReadContracts` mapping), as the object reference changes on every render.
**Action:** Always flatten object props to primitives for `memo`ized list items to ensure referential stability and prevent unnecessary re-renders.

## 2024-05-22 - Conflicting Visual Implementations
**Learning:** Found a case where a component (`Spinner`) implemented a visual effect (SVG path) while reusing a CSS class (`.spinner`) that implemented the same effect differently (border rotation), resulting in a double-spinner artifact.
**Action:** When creating or optimizing UI components, verify that utility classes (like `.spinner`) do not impose conflicting visual styles (borders, backgrounds) on elements that provide their own visuals (SVGs, canvases). Use atomic utility classes (e.g., `.animate-spin`) for behavior to avoid this collision.

## 2024-05-23 - Unconstrained Next.js Image Downloads
**Learning:** Next.js `Image` components constrained by CSS `max-width` (e.g., a banner inside a 1200px container) will still cause the browser to download unnecessarily large, full-viewport images (up to 3840w) on wide screens if the `sizes` prop is missing.
**Action:** Always explicitly define the `sizes` prop (e.g., `sizes="(max-width: 1200px) 100vw, 1200px"`) for `Image` components that are constrained by CSS to prevent wasted bandwidth.
