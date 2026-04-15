## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-04-15 - Pagination for Web3 Multicalls
**Learning:** Unbounded Wagmi `useReadContracts` multicalls mapped to dynamic contract counters (like `marketCount`) cause O(N) payload explosions and hit RPC limits.
**Action:** Always implement offset pagination (e.g., `PAGE_SIZE`) for dynamic list rendering.
