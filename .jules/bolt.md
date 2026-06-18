## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-02-17 - Client-Side Hex Conversion Optimization
**Learning:** Manually converting `Uint8Array` to hex via `.map(...).join('')` creates thousands of intermediate string objects, causing GC pressure in hot paths or tight loops.
**Action:** Use `viem.toHex()` (or `ethers.hexlify()`) which uses optimized bitwise operations and direct string concatenation.
