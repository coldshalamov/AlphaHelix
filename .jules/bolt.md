## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-01-26 - TanStack Query v5 refetchInterval Callback Parameter
**Learning:** In TanStack Query v5 (used by Wagmi v2), the `refetchInterval` callback parameter is the `query` object, not the raw `data`. Trying to access `data[0]` directly crashes the conditional polling logic or resolves to `undefined`, breaking optimizations like smart polling on resolved markets.
**Action:** To access data inside `refetchInterval` to stop polling on resolved states, always access the data via `query.state.data`.
