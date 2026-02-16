## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to UI jitter and RPC throttling.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-02-16 - Avoiding useEffect for Initial State in Client-Only Components
**Learning:** Components fetching data via `useReadContracts` (client-side) often initialize state to 'loading' or 'unknown', then update it in a `useEffect` once data arrives. This causes a double render (one with data but default state, one with calculated state).
**Action:** Use `useMemo` or direct calculation during render to derive the initial state immediately when data becomes available. Use `useEffect` only to schedule *future* updates (like timers), not to set the initial value.
