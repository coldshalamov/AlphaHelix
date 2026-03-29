## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-03-29 - O(N) Payload Explosion with Wagmi multicall
**Learning:** Unbounded Wagmi `useReadContracts` multicalls mapped to total contract counters (e.g., `marketCount`) cause O(N) payload explosions, severely degrading RPC performance and client processing time.
**Action:** Always implement offset pagination (fetching fixed `PAGE_SIZE` slices) when rendering dynamic lists to avoid exceeding RPC limits.
