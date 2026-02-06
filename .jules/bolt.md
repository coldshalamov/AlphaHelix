## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.

## 2026-03-01 - Optimizing DApp Lists with Pagination
**Learning:** Fetching full on-chain lists (e.g., all markets) via `useReadContracts` loop is an O(N) operation that scales poorly and blocks the UI. Even with multicall, large N causes massive payload size and React reconciliation overhead.
**Action:** Implement client-side pagination with `useReadContracts` by slicing the request array based on `page` state, ensuring O(1) fetch size regardless of total item count.

## 2026-03-02 - GitHub Actions Deprecations
**Learning:** `actions/upload-artifact@v3` is deprecated and causes hard failures in CI pipelines due to Node 16 end-of-life on GitHub runners.
**Action:** Upgrade to `actions/upload-artifact@v4`. Note that v4 artifacts are immutable by default and cannot be overwritten without explicit configuration.

## 2026-03-02 - GitHub Actions Permissions
**Learning:** When using `actions/github-script` to post comments on PRs, the default GITHUB_TOKEN permissions are often insufficient (read-only) for `pull-requests`.
**Action:** Explicitly define `permissions: { pull-requests: write }` in the job configuration to avoid 403 Forbidden errors.
