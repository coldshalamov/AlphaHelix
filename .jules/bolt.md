## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2024-07-15 - React State for CSS Animations
**Learning:** Using `useState` and `useEffect` to append CSS animation classes after initial render (e.g. `isVisible ? 'animate-fade' : ''`) is an anti-pattern. It delays First Contentful Paint (FCP) and triggers an unnecessary full-page React re-render.
**Action:** Apply static CSS animation classes directly in JSX so the browser can execute the animations immediately upon parsing the HTML/CSS before JS hydration even begins.
