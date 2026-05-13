## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-05-13 - TanStack Query v5 refetchInterval Callback

**Learning:** In TanStack Query v5 (used by Wagmi v2), the `refetchInterval` callback receives the `query` object instead of the direct `data`. Using `(data) => data.xyz` results in `undefined` and can silently break conditional polling logic.
**Action:** Always access data via `query.state.data` within the `refetchInterval` callback in TanStack Query v5 to correctly implement smart polling.
