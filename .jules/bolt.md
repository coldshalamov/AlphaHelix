## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-05-24 - TanStack Query v5 refetchInterval API Change
**Learning:** In `@tanstack/react-query` v5 (used by Wagmi v2), the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`. Previously, assuming it was `data` caused `data?.[0]?.result` to be undefined, leading to infinite network polling instead of stopping when the market resolves.
**Action:** Always access data via `query.state.data` in v5 query callbacks like `refetchInterval` to ensure dynamic polling logic functions correctly and stops network requests when no longer needed.
