## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-04-25 - Optimize byte array hex conversion
**Learning:** Manual array mapping and string concatenation (like `Array.from(buf).map(...).join('')`) to convert byte buffers to hex strings incurs unnecessary memory overhead.
**Action:** Use `viem`'s native `bytesToHex` utility for efficient conversion instead.
