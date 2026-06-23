## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-06-23 - React Query v5 refetchInterval
**Learning:** In TanStack React Query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Accessing properties directly on the argument causes it to be undefined, leading to infinite polling.
**Action:** Always access `query.state.data` inside the `refetchInterval` callback when using React Query v5 to prevent infinite network polling bugs.
