## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2024-05-24 - Hex Generation Performance
**Learning:** Manual byte-array to hex string conversion (e.g., `Array.from(buffer).map(...).join('')`) is an anti-pattern causing excessive intermediate allocations and GC pressure.
**Action:** Always use native utilities like `bytesToHex` from `viem` for optimal memory/CPU performance on the frontend. Note that `bytesToHex` natively returns a `0x`-prefixed string.
