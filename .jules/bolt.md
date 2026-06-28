## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-06-28 - TanStack Query v5 refetchInterval signature change
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback function receives the `query` object as its first argument, not the raw `data` object like in v4. Attempting to access `data[0]` directly on the `query` object causes infinite polling because the condition evaluates incorrectly.
**Action:** Always access the data via `query.state.data` when using conditional polling in `refetchInterval` with TanStack Query v5.
