## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-06-12 - TanStack Query v5 refetchInterval API
**Learning:** In TanStack Query v5 (used by Wagmi v2), the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Incorrectly accessing it causes the interval to never stop, leading to infinite RPC polling bugs.
**Action:** Always access the data via `query.state.data` in `refetchInterval` to correctly implement smart polling logic and stop polling when conditions are met.
