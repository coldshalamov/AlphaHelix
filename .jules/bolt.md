## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-06-09 - TanStack Query v5 refetchInterval Polling Bug
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument rather than the raw `data`. Attempting to read state directly from the argument causes it to silently fail, bypassing the stop condition and leading to infinite network polling.
**Action:** Always access `query.state.data` inside the `refetchInterval` callback when using React Query v5 to correctly read the current state and prevent unintended RPC spam.
