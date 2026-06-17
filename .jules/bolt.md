## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-01-26 - Viem bytesToHex vs Array Mapping
**Learning:** Converting byte buffers/arrays to hex strings using manual array mapping and string concatenation (like `Array.from(buf).map(...).join('')`) introduces significant memory overhead. Using `viem`'s native `bytesToHex` utility is much more efficient.
**Action:** Always use native optimized utilities like `bytesToHex` from `viem` when converting bytes to hex instead of rolling custom array transformations.
