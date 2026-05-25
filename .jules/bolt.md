## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-05-25 - TanStack Query v5 refetchInterval signature
**Learning:** In TanStack Query v5, the `refetchInterval` callback receives the `query` object instead of the `data` directly. Using the old signature causes silent failures where data-dependent polling logic never executes correctly, leading to infinite polling.
**Action:** Always use `query.state.data` to access query results within `refetchInterval` when using TanStack Query v5 (or Wagmi v2).
