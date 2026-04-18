## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2026-04-18 - Next.js Font Loading Optimization
**Learning:** Using `next/font/google` without explicitly setting `display: 'swap'` causes the browser to hide text while the font is loading (FOIT - Flash of Invisible Text), blocking the critical rendering path and negatively impacting Largest Contentful Paint (LCP).
**Action:** Always include `display: 'swap'` in the font configuration to ensure text is visible immediately using a fallback font, improving perceived performance.
