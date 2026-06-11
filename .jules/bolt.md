## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-06-11 - TanStack Query v5 refetchInterval API
**Learning:** In `@tanstack/react-query` v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Attempting to access `data` directly will result in undefined, causing smart polling logic based on data state to fail and default to continuous polling.
**Action:** When configuring conditional polling with `refetchInterval` in Wagmi/React Query v5, always access the data via `query.state.data` to correctly evaluate the current state and prevent infinite network request loops.
