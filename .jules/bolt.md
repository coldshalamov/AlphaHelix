## 2026-07-07 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2026-07-07 - Static Animation Hydration Re-renders
**Learning:** Using `useState` and `useEffect` to lazily apply CSS animation classes after component mount (e.g., `isVisible ? 'animate-fade' : ''`) is an anti-pattern that harms First Contentful Paint (FCP) and causes unnecessary full-page re-renders. Next.js can server-render these classes, allowing the browser to animate them immediately upon CSS load without waiting for JS hydration.
**Action:** Always apply static CSS animation classes directly to elements in the JSX to prevent hydration delays and eliminate unnecessary state/effect overhead.
