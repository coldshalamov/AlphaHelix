## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-04-16 - Prevent O(N) Array Operations for Hex Conversion
**Learning:** Manual array mapping to convert buffers/byte arrays to hex strings (`Array.from(buf).map(...).join('')`) causes slow O(N) operations. This was unnecessarily implemented when generating salts from random buffers.
**Action:** Always prefer native library utilities like viem's `bytesToHex` for O(1) performance when converting byte arrays to hex strings.
