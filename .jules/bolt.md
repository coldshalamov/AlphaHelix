## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
## 2026-04-28 - Optimize salt generation with viem bytesToHex
**Learning:** Using Array.from().map().join('') for hex string conversion creates unnecessary memory overhead. viem provides a highly optimized native bytesToHex utility that avoids creating intermediate arrays.
**Action:** When working with cryptography buffers or salts in web3 apps, always use viem's native utils like bytesToHex instead of manual JS array mapping.
