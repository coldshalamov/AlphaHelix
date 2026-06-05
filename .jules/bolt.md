## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-06-05 - Fix TanStack Query v5 API signature in refetchInterval
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object instead of raw data. Misinterpreting this argument prevents the termination condition from evaluating correctly, leading to infinite background network polling even when polling should cease (e.g., when a market is resolved).
**Action:** Always access `query.state.data` instead of the first argument directly in `refetchInterval` callbacks in TanStack Query v5.
