## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-01-28 - React Query v5 refetchInterval
**Learning:** In `@tanstack/react-query` v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Trying to access `data[0]` directly fails, leading to infinite polling because the condition to stop polling (`return false`) is never met.
**Action:** Always access data via `query.state.data` in v5 `refetchInterval` callbacks to correctly evaluate stopping conditions and prevent RPC spam.
