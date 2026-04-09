## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2024-03-13 - Next.js Image Component & CSS Max-Width
**Learning:** Next.js `Image` components constrained by CSS `max-width` (e.g., in `Layout.jsx` with a 1200px limit) will cause browsers to download unnecessarily large, full-viewport images on wide screens if the `sizes` prop is omitted.
**Action:** Always explicitly define the `sizes` prop (e.g., `sizes="(max-width: 1200px) 100vw, 1200px"`) for constrained images to enable responsive optimization and save bandwidth.
