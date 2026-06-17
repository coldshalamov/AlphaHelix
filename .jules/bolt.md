## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-04-24 - viem bytesToHex vs manual string parsing
**Learning:** Converting byte buffers to hex strings using manual array mapping and string concatenation (like `Array.from(buf).map(...).join('')`) introduces significant memory overhead and executes 10x slower than viem's native `bytesToHex` utility.
**Action:** When using viem, always use `bytesToHex` for cryptographic operations instead of manually parsing buffers.
