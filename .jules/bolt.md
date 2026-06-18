## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2024-03-24 - Extracting Static Arrays & Configuration Outside Functional Components
**Learning:** Instantiating static arrays (like error message lists) or configuration constants (like contract configs and chain IDs) inside functional components or `useMemo` hooks adds unnecessary overhead. Though `useMemo` prevents reallocation on every render, it still requires React to evaluate the hook and store the reference. For entirely static values, this is an anti-pattern.
**Action:** Always extract static variables, arrays, and configuration objects outside the component's functional scope (to module scope) to prevent initialization overhead, save memory, and simplify dependency arrays.
