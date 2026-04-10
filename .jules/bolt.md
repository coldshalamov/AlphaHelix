## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-04-10 - O(N) Multicall Explosions in Dynamic Lists
**Learning:** Mapping Wagmi `useReadContracts` directly to total contract counters (e.g., `marketCount`) without pagination causes O(N) payload explosions as the count grows. This leads to slow rendering, massive network requests, and eventually RPC rate limiting or hard failures.
**Action:** Always implement offset pagination (fetching fixed `PAGE_SIZE` slices) when rendering dynamic lists based on on-chain counters, slicing the multicall array into bounded chunks.
