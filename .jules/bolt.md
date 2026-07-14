## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
**Action:** Always configure `QueryClient` with a global `staleTime` (e.g., 4000ms) matching the chain's block time to prevent redundant network requests.
## 2024-07-05 - TanStack Query v5 refetchInterval Callback
**Learning:** In @tanstack/react-query v5, the `refetchInterval` callback receives the `query` object as its first argument, not the raw `data`.
**Action:** Always access the data via `query.state.data` in the `refetchInterval` callback to prevent errors and infinite network polling.
## 2024-07-14 - CI Failures and Github Action Version Upgrades
**Learning:** Old GitHub actions version causes CI to fail.
**Action:** When a GitHub Actions workflow using `actions/github-script`, `actions/upload-artifact`, `actions/setup-node`, or `actions/checkout` fails because of deprecation or being outdated, upgrade it to the new recommended versions (`@v4` for checkout/setup-node/upload-artifact, `@v7` for github-script). Also, ensure the Hardhat gas reporter plugin is installed (`pnpm install hardhat-gas-reporter`) and configured properly in `hardhat.config.js` to output `gas-report.txt` when a CI expects it as an artifact.
## 2024-07-14 - GitHub Actions Token Permissions for Pull Requests
**Learning:** By default, GitHub Actions tokens might not have write access to pull requests or issues.
**Action:** When creating a comment on a pull request using `actions/github-script`, ensure that the specific job has `permissions: pull-requests: write` and `issues: write` added to its configuration block in the workflow file.
