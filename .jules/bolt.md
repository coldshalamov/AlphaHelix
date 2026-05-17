## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-05-17 - TanStack Query v5 `refetchInterval` Parameter
**Learning:** In TanStack Query v5 (used by Wagmi v2), the `refetchInterval` callback receives the `query` object instead of the `data` directly. Accessing data directly from the parameter results in undefined, which can break conditional polling logic (e.g., smart polling).
**Action:** When using `refetchInterval` for conditional polling, access the data via `query.state.data` instead of assuming the first parameter is the data itself.
