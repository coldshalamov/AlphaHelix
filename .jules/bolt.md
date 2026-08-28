## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2026-07-24 - Static Animation Hydration Pitfall
**Learning:** Using `useState` and `useEffect` to lazily apply CSS animation classes after component mount is an anti-pattern that harms FCP. When refactoring these to static CSS classes, failing to remove the initial `opacity: 0` rules (previously managed by JS) causes elements to remain permanently invisible if the animation keyframes don't explicitly reset them or if hydration fails.
**Action:** Always apply static CSS animation classes directly in JSX for Next.js SSR, and explicitly search for and remove any hardcoded hidden states (like `opacity: 0`) when removing JS hydration logic.
