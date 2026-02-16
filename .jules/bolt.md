## 2026-02-16 - Handling Decimals in Ethers.js Fuzzing Tests
**Learning:** When generating random floating-point numbers for fuzzing tests and converting them to BigInt with `ethers.parseEther`, you must truncate the decimal precision (e.g., using `.toFixed(18)`). `Math.random()` can produce values with more than 18 decimal places (like `0.0029515265517127036`), causing `ethers` to throw a `RangeError` ("too many decimals").
**Action:** Always format random float inputs to strings with a fixed precision (<= 18) before parsing them as Ether in tests.

## 2026-02-16 - Hardhat Gas Reporter Output
**Learning:** The `hardhat-gas-reporter` plugin does not write to a file by default even if `REPORT_GAS=true`. For CI workflows that depend on reading a report file (e.g., `gas-report.txt`), you must explicitly configure `outputFile: "gas-report.txt"` and `noColors: true` in `hardhat.config.js`.
**Action:** Verify `hardhat.config.js` includes file output configuration if the CI pipeline expects to read gas stats.

## 2026-02-16 - Deprecated GitHub Actions
**Learning:** `actions/upload-artifact@v3` and `codecov/codecov-action@v3` are deprecated and may cause immediate workflow failures on newer runners.
**Action:** Proactively upgrade these actions to `v4` in `.github/workflows` when touching CI configurations.
