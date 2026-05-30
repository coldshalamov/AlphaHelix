## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-05-30 - Wagmi v2 / TanStack Query v5 refetchInterval Callback
**Learning:** In Wagmi v2 (which uses TanStack Query v5), the `refetchInterval` callback receives the `query` object, not the `data` directly. Attempting to access data directly via the first argument results in undefined values, which silently breaks conditional polling logic (causing infinite polling and wasted RPC calls).
**Action:** Always use `query.state.data` to access query results within the `refetchInterval` callback when implementing smart polling logic in Wagmi v2.
