## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-01-26 - Wagmi Multicall Payload Explosion
**Learning:** Unbounded Wagmi `useReadContracts` multicalls mapped to total contract counters (e.g., `marketCount`) cause O(N) network request payload explosions, which can easily exceed RPC rate limits as the contract state grows.
**Action:** Always implement offset pagination (fetching fixed `PAGE_SIZE` slices) when rendering dynamic lists to maintain O(1) request payloads and avoid RPC throttling.
