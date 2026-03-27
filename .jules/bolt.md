## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-03-27 - Bounded Multicalls
**Learning:** Wagmi multicall reads mapped directly to a total contract counter (like `marketCount`) cause an O(N) payload explosion as the contract grows, blocking the UI and exceeding RPC limits.
**Action:** Always implement pagination or bounding when fetching dynamic contract lists using `useReadContracts`.
