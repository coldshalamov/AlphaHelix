## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-05-26 - TanStack Query v5 refetchInterval Callback Signature Change
**Learning:** In TanStack Query v5 (used by Wagmi v2), the `refetchInterval` callback receives the `query` object, not the `data` directly. Assuming the argument is `data` causes smart polling logic to silently fail (always returning undefined for `data`), resulting in continuous unnecessary RPC polling and re-renders.
**Action:** When accessing query results inside the `refetchInterval` callback for conditional polling, always access it via `query.state.data`.
