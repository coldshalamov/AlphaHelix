## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-01-26 - TanStack Query v5 refetchInterval API Change
**Learning:** In `@tanstack/react-query` v5 (used by Wagmi v2), the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Accessing `data` directly causes undefined errors, which can inadvertently return falsy values and cause infinite network polling.
**Action:** Always access data via `query.state.data` in `refetchInterval` callbacks when using v5+ to ensure conditional polling logic works correctly and prevents RPC exhaustion.
