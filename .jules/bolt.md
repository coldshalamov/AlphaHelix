## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-01-26 - TanStack Query v5 API Changes causing Infinite Polling
**Learning:** The frontend utilizes `@tanstack/react-query` v5. In version 5, the `refetchInterval` callback receives the `query` object as its first argument (not the raw `data`). Attempting to access `data` directly causes undefined values, leading to infinite network polling bugs when conditional logic relies on the data.
**Action:** Always access the data via `query.state.data` inside the `refetchInterval` callback to properly conditionally stop polling and save RPC calls.
