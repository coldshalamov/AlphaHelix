## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.
## 2026-04-27 - [CI Hardhat Gas Reporter]
**Learning:** In GitHub Actions, when `hardhat-gas-reporter` output is expected by a subsequent step (like `actions/github-script`), piping `npm test | tee gas-report.txt` breaks formatting with ANSI codes.
**Action:** Configure `hardhat-gas-reporter` to natively output to a file by setting `outputFile: "gas-report.txt"` and `noColors: true` inside `hardhat.config.js`, and avoid using `tee` in the CI pipeline.
## 2026-04-27 - [GitHub Actions Job Permissions]
**Learning:** In GitHub Actions, explicitly declaring a `permissions` block at the job level strips all unspecified permissions. This means omitting `contents: read` will break the `actions/checkout` step with a 403 Forbidden error.
**Action:** When adding specific permissions like `pull-requests: write` to a job, always ensure you also explicitly include `contents: read` to maintain access to the repository code.
