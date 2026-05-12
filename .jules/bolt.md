## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-01-26 - TanStack Query v5 refetchInterval Callback API Change
**Learning:** In React Query v5 (used by Wagmi v2), the signature for the `refetchInterval` callback changed. It no longer receives `(data, query)`, but instead receives just the `query` object. Attempting to access `data` directly from the first argument returns undefined and can break conditional polling logic (e.g., stopping polling when a market resolves).
**Action:** Always access query results within `refetchInterval` via `query.state.data`. Ensure the code correctly destructures or navigates the query state to make polling conditions work as expected.
