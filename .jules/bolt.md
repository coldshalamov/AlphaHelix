## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-03-01 - Optimizing DApp Lists with Pagination
**Learning:** Fetching full on-chain lists (e.g., all markets) via `useReadContracts` loop is an O(N) operation that scales poorly and blocks the UI. Even with multicall, large N causes massive payload size and React reconciliation overhead.
**Action:** Implement client-side pagination with `useReadContracts` by slicing the request array based on `page` state, ensuring O(1) fetch size regardless of total item count.
