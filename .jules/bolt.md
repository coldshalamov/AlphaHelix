## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-05-21 - TanStack Query v5 refetchInterval Signature
**Learning:** In TanStack Query v5 (used by Wagmi v2), the `refetchInterval` callback receives the `query` object rather than the `data` directly. Attempting to access data directly fails silently and causes conditional polling logic to break, leading to infinite RPC calls.
**Action:** Always use `query.state.data` to access query results within `refetchInterval` for conditional polling.
