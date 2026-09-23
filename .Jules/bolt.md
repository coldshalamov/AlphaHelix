## 2026-01-19 - [React.memo breaks with Object Props]
**Learning:** `React.memo` is ineffective when components receive object props derived from fresh parent state (e.g. `useReadContracts` mapping), as the object reference changes on every render.
**Action:** Always flatten object props to primitives for `memo`ized list items to ensure referential stability and prevent unnecessary re-renders.

## 2024-05-22 - Conflicting Visual Implementations
**Learning:** Found a case where a component (`Spinner`) implemented a visual effect (SVG path) while reusing a CSS class (`.spinner`) that implemented the same effect differently (border rotation), resulting in a double-spinner artifact.
**Action:** When creating or optimizing UI components, verify that utility classes (like `.spinner`) do not impose conflicting visual styles (borders, backgrounds) on elements that provide their own visuals (SVGs, canvases). Use atomic utility classes (e.g., `.animate-spin`) for behavior to avoid this collision.
## 2026-04-17 - Replaced setInterval with requestAnimationFrame in Countdown
**Learning:** Using setInterval for UI updates like countdowns can cause janky updates and drift because it runs in the macro-task queue and does not align with screen refresh rates, even if firing at 1s intervals. When tab is backgrounded, it can pile up or delay.
**Action:** Use requestAnimationFrame combined with timestamp throttling to run updates smoothly in sync with browser paints.
## 2026-04-17 - Wagmi useReadContracts Pagination
**Learning:** Unbounded Wagmi `useReadContracts` multicalls mapped to dynamic contract counters (like `marketCount`) cause O(N) payload explosions and hit RPC limits.
**Action:** Always implement offset pagination (e.g., `PAGE_SIZE`) for dynamic list rendering.
## 2024-07-22 - JS-Hydrated Animations Anti-Pattern
**Learning:** Using `useState` and `useEffect` to lazily apply CSS animation classes after component mount (e.g., `isVisible ? 'animate-fade' : ''`) is a common anti-pattern in Next.js that harms First Contentful Paint (FCP) and causes unnecessary full-page re-renders.
**Action:** Always apply static CSS animation classes directly to elements in the JSX to allow the browser to animate them immediately upon CSS load without waiting for JS hydration. When refactoring, ensure any hardcoded hidden states (like `opacity: 0`) are removed so elements don't remain invisible if JS/CSS fails.

## 2024-07-22 - Countdown CPU De-optimization
**Learning:** Replacing a 1Hz `setInterval` with a raw `requestAnimationFrame` loop for a low-frequency UI update (like a 1-second countdown) causes severe CPU de-optimization by executing the logic 60-120 times per second needlessly.
**Action:** When using `requestAnimationFrame` for infrequent updates, always implement timestamp throttling to limit execution frequency.
