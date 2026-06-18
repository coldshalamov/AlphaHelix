## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-01-26 - Hex Formatter Performance
**Learning:** Generating salt hashes using Array mapping and string concatenation (`Array.from(buf).map...join`)
causes slow \(O(n)\) operations. Viem's native `bytesToHex` utility handles this internally at \(O(1)\) time, reducing compute load overhead during user actions.
**Action:** Replace arbitrary array-based buffer to hex loops with `bytesToHex` directly where viem is available.
