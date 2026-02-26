## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-02-26 - Next.js Image Optimization
**Learning:** Next.js `Image` component defaults to `sizes="100vw"` when using `fill` or responsive modes, causing browsers to download viewport-width images even for container-constrained elements.
**Action:** Always specify the `sizes` prop (e.g., `(max-width: 1200px) 100vw, 1200px`) for images inside max-width containers to prevent massive LCP regressions on large screens.
