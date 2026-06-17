## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-06-17 - Fix React Query v5 refetchInterval Infinite Polling
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Incorrectly accessing `data?.[0]` causes the function to fail or evaluate incorrectly, which could lead to unintended infinite network polling (ignoring the intended false/disable return value).
**Action:** Always access data via `query.state.data` within the `refetchInterval` callback in React Query v5 when making conditional polling decisions.
