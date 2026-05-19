## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-05-19 - Fix infinite polling in Wagmi/TanStack Query v5
**Learning:** Wagmi v2 uses TanStack Query v5, where the `refetchInterval` callback parameter was changed from `data` to the `query` object. Accessing data directly from the parameter fails, causing smart polling conditions to evaluate incorrectly and fallback to infinite polling.
**Action:** When implementing conditional `refetchInterval` logic in TanStack Query v5, always access the query data via `query.state.data` to ensure polling correctly halts when conditions are met, saving RPC calls and client re-renders.
