## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-06-21 - TanStack Query v5 `refetchInterval` polling bug
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object as its argument, not the raw `data`. Code expecting `data` directly will incorrectly parse `undefined`, causing bugs like failing to disable active polling loops when a condition is met.
**Action:** Always access data via `query.state.data` in v5 `refetchInterval` callbacks to prevent infinite network polling.
