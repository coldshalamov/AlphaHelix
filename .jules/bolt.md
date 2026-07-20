## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2025-02-15 - React Static Animation Hydration
**Learning:** Using `useState` and `useEffect` to lazily apply CSS animation classes (e.g., `isVisible ? 'animate-fade' : ''`) and starting elements with `opacity: 0` is an anti-pattern. It harms First Contentful Paint (FCP) and causes unnecessary full-page re-renders, as the browser waits for full JS hydration before showing elements.
**Action:** Next.js can server-render these classes. Always apply static CSS animation classes directly to elements in the JSX to allow the browser to animate them immediately upon CSS load without waiting for JS hydration. Ensure you remove the initial hidden states (like `opacity: 0`) from CSS that were managed by the removed JS logic.
