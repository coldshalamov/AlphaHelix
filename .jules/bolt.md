## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-02-06 - Manual Hex Conversion Performance
**Learning:** Manually converting byte arrays to hex strings using `Array.from().map().join()` creates unnecessary intermediate objects and string allocations, increasing garbage collection pressure.
**Action:** Use optimized library utilities like `viem`'s `toHex()` which handle buffer conversion directly and efficiently.
