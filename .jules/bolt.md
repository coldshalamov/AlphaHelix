## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-05-31 - TanStack Query v5 conditional polling argument signature
**Learning:** In Wagmi v2 / TanStack Query v5, the `refetchInterval` callback receives the `query` object, not the direct `data`. Relying on `data` directly evaluates to undefined, preventing conditional logic from ever stopping the interval and causing infinite RPC polling loops.
**Action:** Always access data via `query.state.data` within `refetchInterval` in TanStack Query v5 when implementing smart polling logic to correctly evaluate conditions and stop background fetches.
