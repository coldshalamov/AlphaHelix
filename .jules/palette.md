## 2024-07-08 - Added semantic accessibility to market pagination
**Learning:** Found that `<nav aria-label="Pagination">` and explicit `type="button"` attributes inside Next.js components improve accessibility navigation for multi-page data listings. When pagination updates state, appending `aria-live="polite"` helps announce transitions implicitly.
**Action:** Always wrap pagination controls with semantic HTML (`<nav>`) and include proper ARIA and descriptive button labels instead of relying solely on `<div>` structures.
## 2024-07-08 - Fixed CI/CD Github action workflows
**Learning:** Found that `actions/upload-artifact@v3`, `actions/checkout@v3`, `actions/setup-node@v3` and `actions/github-script@v6` were deprecated. Node.js 20 is deprecated for `actions/setup-node@v3`. `hardhat-gas-reporter` was missing which caused the `gas-report.txt` file generation to fail.
**Action:** Always ensure that GitHub actions workflows are using the latest supported versions. Ensure devDependencies like `hardhat-gas-reporter` are present if they are depended upon in tests or CI/CD pipelines.
## 2024-07-08 - Fixed GitHub Action permissions
**Learning:** Found that the `actions/github-script` was failing to post the gas report comment due to the `Resource not accessible by integration` error, which indicates missing permissions to write to pull requests or issues.
**Action:** Always verify that workflows interacting with PRs or issues explicitly declare `permissions: pull-requests: write` and `issues: write` at the top of the workflow or job.
