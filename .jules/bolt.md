## 2026-01-26 - Wagmi & React Query Stale Time
**Learning:** Wagmi v2 uses standard TanStack Query defaults which set `staleTime: 0`. For dApps, this causes aggressive refetching of on-chain data (balance, reads) on every focus/mount, leading to RPC throttling and UI jitter.

## 2026-05-18 - TanStack Query v5 refetchInterval signature

## 2026-05-18 - CI Gas Reporter Workflow Fix
**Learning:** Piping output using `tee` inside a GitHub actions step (e.g. `npm test | tee gas-report.txt`) introduces ANSI color codes which breaks downstream workflow steps interpreting the file. Also, relying on standard stdout redirection can sometimes miss critical output.
**Action:** Use the native Hardhat gas reporter configuration (e.g., `gasReporter: { outputFile: "gas-report.txt", noColors: true }`) in `hardhat.config.js` to ensure clean text output for downstream Github Actions scripts.
