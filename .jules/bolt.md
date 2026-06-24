## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-06-24 - React Query v5 refetchInterval API Change
**Learning:** In TanStack React Query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Incorrectly accessing `data` directly results in `undefined` and can cause infinite polling bugs (RPC spam).
**Action:** When using `refetchInterval` in React Query v5, always access the data via `query.state.data` to prevent infinite network polling.
