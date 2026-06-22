## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-01-26 - TanStack Query v5 refetchInterval
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. The previous implementation was accessing `data?.[0]?.result` directly, which broke smart polling and caused silent network failures.
**Action:** When migrating or updating to React Query v5, always update dynamic `refetchInterval` callbacks to access data via `query.state.data`.
