## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.

## 2026-05-18 - TanStack Query v5 refetchInterval signature
**Learning:** In TanStack Query v5 (used by Wagmi v2), the `refetchInterval` callback receives the `query` object, not the `data` directly. Using `data` results in undefined and breaks conditional polling logic (e.g., stopping polling when a market is resolved).
**Action:** To access query results within `refetchInterval` for conditional polling, use `query.state.data`.
