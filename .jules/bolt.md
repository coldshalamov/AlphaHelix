## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-06-13 - TanStack Query v5 refetchInterval API
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Attempting to access data directly from the first argument will fail, leading to fallback behavior (like infinite polling if a stop condition is missed).
**Action:** Always access data within the `refetchInterval` callback via `query.state.data` in v5 applications to properly implement conditional polling logic.
