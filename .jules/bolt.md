## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-04-05 - Pagination State Boundaries on Dynamic Web3 Data
**Learning:** When implementing offset pagination with Web3 hooks like `useReadContracts` based on dynamic counters (e.g., `marketCount`), network switching can drastically change the total count. If a user is on page 3 and switches to a network with fewer items, the `page` state becomes out-of-bounds, causing an empty list to render and trapping the user if pagination controls hide when `totalPages` is 1.
**Action:** Always pair offset pagination of dynamic web3 arrays with a `useEffect` bounds-checker that safely resets the `page` state (e.g., `setPage(totalPages - 1)`) if the calculated `totalPages` drops below the current `page` index.
