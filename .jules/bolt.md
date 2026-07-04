## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-04 - TanStack Query v5 refetchInterval Infinite Polling Bug
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object, not the raw `data`. Incorrectly accessing `data?.[0]` evaluates to `undefined`, causing callbacks to unintentionally return truthy/polling intervals and leak network requests infinitely on resolved on-chain data.
**Action:** Always access data via `query.state.data` in React Query v5 callbacks to accurately assess conditional refetching.
