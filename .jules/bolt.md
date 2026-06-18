## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-02-18 - TanStack Query v5 refetchInterval API
**Learning:** In `@tanstack/react-query` v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Trying to access `data` properties directly on the argument results in `undefined`, which can silently break conditional polling logic (e.g., stopping polling when a condition is met).
**Action:** Access the data via `query.state.data` in `refetchInterval` callbacks to ensure smart polling optimizations work correctly and prevent infinite RPC polling.
