## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-05-24 - Avoid Manual Byte Array to Hex Conversions
**Learning:** Manually converting byte buffers to hex strings using `Array.from(buf).map(...).join('')` incurs unnecessary memory overhead.
**Action:** Use native utility functions like `bytesToHex` from `viem` for optimal memory efficiency and better readability.
