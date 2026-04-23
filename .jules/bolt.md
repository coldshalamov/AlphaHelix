## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-04-23 - Use viem bytesToHex instead of manual buffer mapping
**Learning:** Avoid using manual array mapping and string concatenation (e.g., Array.from(buf).map(...).join('')) to convert buffers/byte arrays to hex strings. It has memory overhead and is slower.
**Action:** Use viem's native bytesToHex utility instead for converting buffers to hex strings.
