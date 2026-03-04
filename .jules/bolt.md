## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-01-28 - Wagmi Double RPC Polling
**Learning:** Setting a component state variable (like `txHash`) that is watched by Wagmi's `useWaitForTransactionReceipt` for intermediate transactions (e.g., token approvals) while simultaneously awaiting `publicClient.waitForTransactionReceipt` causes redundant RPC polling calls for the same transaction hash.
**Action:** When handling sequential transactions (like Approve -> Action) and awaiting imperatively, do not set the transaction hash into the component state watched by `useWaitForTransactionReceipt` hook. Handle the intermediate loading UI state manually.
