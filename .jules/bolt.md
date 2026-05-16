## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-03-15 - React Static Variables & useMemo
**Learning:** Static arrays or constants instantiated inside a component or inside a useMemo hook cause unnecessary overhead. Even if wrapped in `useMemo([], [...])`, React has to execute the initialization logic at least once on mount.
**Action:** Extract static data objects (like configuration constants or string arrays used for condition matching) out of the component's functional scope entirely.
