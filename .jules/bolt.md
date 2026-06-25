## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-06-25 - React Query v5 refetchInterval Polling Bug
**Learning:** The smart polling mechanism intended to disable RPC polling for resolved markets failed silently. In TanStack Query v5, the `refetchInterval` callback receives the `query` object, not the raw `data`. Because of this, accessing `data[0]` was undefined, causing the function to always return the 5000ms polling interval.
**Action:** Always access data via `query.state.data` in the `refetchInterval` callback when using React Query v5 to correctly read cache state and dynamically pause polling.
