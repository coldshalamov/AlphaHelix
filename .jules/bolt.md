## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-01-26 - TanStack Query v5 refetchInterval
**Learning:** In TanStack Query v5, the callback for `refetchInterval` receives the `query` object as the first argument, not the raw `data`. Trying to access `data` directly results in `undefined` checks.
**Action:** Always access data via `query.state.data` in the `refetchInterval` callback when using React Query v5 to prevent bugs like infinite polling loops on resolved states.
