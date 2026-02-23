## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-02-04 - Efficient Hex Conversion with Viem
**Learning:** `Array.from().map().join()` is extremely inefficient for converting `Uint8Array` to hex strings in JavaScript, causing O(N) object allocations. `viem.toHex()` is ~10x faster (7ms vs 75ms for 10k ops) and cleaner.
**Action:** Always use `toHex` or `bytesToHex` from web3 libraries (`viem`, `ethers`) instead of manual string manipulation.
