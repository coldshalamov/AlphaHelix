## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-02 - TanStack Query v5 refetchInterval Callback Signature
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Trying to access properties on `data` without traversing `query.state.data` results in undefined values, leading to silent failures like infinite network polling.
**Action:** Always access data via `query.state.data` when evaluating conditional polling logic inside `refetchInterval` to prevent unnecessary RPC calls.
