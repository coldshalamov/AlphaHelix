## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-01 - React Query v5 API Change Causes Infinite Polling
**Learning:** In Wagmi v2/React Query v5, the `refetchInterval` callback receives the `query` object instead of raw `data`. Previously, trying to read `data?.[0]?.result` caused an undefined value, so the condition to stop polling (`resolved`) was never met, resulting in infinite RPC calls.
**Action:** Always access data via `query.state.data` in React Query v5 callback functions (like `refetchInterval`) to correctly evaluate conditions and prevent network polling bugs.
