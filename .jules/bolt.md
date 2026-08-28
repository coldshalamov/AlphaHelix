## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2024-07-08 - Remove unnecessary runtime state for CSS animations
**Learning:** Using `useState` and `useEffect` to dynamically apply static CSS animation classes (e.g. `isVisible ? 'animate-fade-in' : ''`) on mount is a React anti-pattern that causes unnecessary full-page re-renders. The Next.js server pre-renders the page without the class, and the client hydrates and immediately re-renders to append it, negatively impacting First Contentful Paint (FCP).
**Action:** Always apply static animation classes directly to the elements in JSX. This allows the browser to animate them immediately upon CSS load and prevents wasteful re-renders.
