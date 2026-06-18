## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2024-03-18 - Extract Static Variables from React Components
**Learning:** Static arrays and configuration constants (like error messages or chain IDs) instantiated inside functional components or `useMemo` hooks cause unnecessary initialization overhead and allocations on every mount or re-render.
**Action:** Always extract static variables outside the component's functional scope to optimize memory usage and rendering performance.
