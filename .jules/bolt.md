## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-03 - TanStack Query v5 refetchInterval API Change
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Attempting to access the data directly from the argument causes it to be `undefined`, which can silently break conditional polling logic and lead to infinite network requests.
**Action:** Always access data via `query.state.data` in the `refetchInterval` callback to correctly evaluate dynamic polling conditions.
