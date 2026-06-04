## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-06-04 - Fix refetchInterval in TanStack Query v5
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. If you try to access the data directly, it will fail and potentially cause infinite polling or stop polling incorrectly.
**Action:** Always access the data via `query.state.data` in `refetchInterval` when using TanStack Query v5.
