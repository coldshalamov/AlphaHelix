## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2025-02-12 - Hex Generation Performance Anti-Pattern
**Learning:** Manual byte-array to hex string conversion (`Array.from(buffer).map(...).join('')`) is an anti-pattern on the frontend. It causes excessive intermediate allocations (creating a new array, multiple strings per byte) leading to GC pressure, especially when generating secure randomness.
**Action:** Use native utilities like `bytesToHex` from `viem` for optimal memory and CPU performance. Note that `bytesToHex` natively returns a `0x`-prefixed string, so do not manually prepend `'0x' +`.
## 2025-02-12 - Wagmi JSON-RPC Batching
**Learning:** Wagmi `http()` transports do not enable JSON-RPC batching by default. This leads to RPC exhaustion and rate limiting when concurrent independent calls (like multiple `useReadContract` hooks on a single page render) are executed.
**Action:** Always configure Wagmi HTTP transports with `{ batch: true }` (e.g., `http(url, { batch: true })`) to aggregate independent contract reads into single, efficient JSON-RPC requests, drastically reducing network overhead.
