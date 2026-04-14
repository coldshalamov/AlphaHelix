## 2026-01-19 - [React.memo breaks with Object Props]
**Learning:** `React.memo` is ineffective when components receive object props derived from fresh parent state (e.g. `useReadContracts` mapping), as the object reference changes on every render.
**Action:** Always flatten object props to primitives for `memo`ized list items to ensure referential stability and prevent unnecessary re-renders.

## 2024-05-22 - Conflicting Visual Implementations
**Learning:** Found a case where a component (`Spinner`) implemented a visual effect (SVG path) while reusing a CSS class (`.spinner`) that implemented the same effect differently (border rotation), resulting in a double-spinner artifact.
**Action:** When creating or optimizing UI components, verify that utility classes (like `.spinner`) do not impose conflicting visual styles (borders, backgrounds) on elements that provide their own visuals (SVGs, canvases). Use atomic utility classes (e.g., `.animate-spin`) for behavior to avoid this collision.
## $(date +%Y-%m-%d) - Wagmi Pagination Stale State Race Condition
**Learning:** When adding offset pagination to `useReadContracts`, Wagmi may momentarily return old, cached data from the previous page while fetching the new page. If the component calculates IDs during rendering using the active `page` state (e.g., `id: page * PAGE_SIZE + i`), the stale data from the previous page will incorrectly render with the *new* page's IDs, causing visual flickering and broken links.
**Action:** When mapping `useReadContracts` results, do not use external `page` state to calculate IDs. Either derive the ID directly from the `contracts` array arguments (since results map 1:1) or use the `isFetching` flag to conditionally hide the list while new data is loading to prevent rendering inconsistent state.
