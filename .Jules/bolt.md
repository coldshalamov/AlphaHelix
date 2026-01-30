## 2026-01-19 - [React.memo breaks with Object Props]
**Learning:** `React.memo` is ineffective when components receive object props derived from fresh parent state (e.g. `useReadContracts` mapping), as the object reference changes on every render.
**Action:** Always flatten object props to primitives for `memo`ized list items to ensure referential stability and prevent unnecessary re-renders.

## 2024-05-22 - Conflicting Visual Implementations
**Learning:** Found a case where a component (`Spinner`) implemented a visual effect (SVG path) while reusing a CSS class (`.spinner`) that implemented the same effect differently (border rotation), resulting in a double-spinner artifact.
**Action:** When creating or optimizing UI components, verify that utility classes (like `.spinner`) do not impose conflicting visual styles (borders, backgrounds) on elements that provide their own visuals (SVGs, canvases). Use atomic utility classes (e.g., `.animate-spin`) for behavior to avoid this collision.

## 2024-05-23 - Manual Hex Conversion Performance
**Learning:** Manual hex string generation (`Array.from().map().join()`) is significantly slower (~4.5x) than using `viem`'s `toHex` utility, especially for cryptographic operations like salt generation.
**Action:** Always prefer `toHex` from `viem` for converting byte arrays to hex strings.

## 2026-01-30 - CI Deprecations and Log Pipe
**Learning:** GitHub Actions v3 (checkout, setup-node, upload-artifact) are deprecated and fail on modern runners (Node 12/16 EOL). Also, creating files in CI via `>` (redirect) suppresses console output, making debugging impossible.
**Action:** Always use v4+ actions. Use `| tee output.txt` instead of `> output.txt` in CI steps when the output is needed both in logs and as a file.

## 2026-01-30 - CI Permissions and Error Handling
**Learning:** `actions/github-script` requires explicit `pull-requests: write` permission to comment. Auto-merge scripts fail entirely if one PR fails when running with default `set -e`.
**Action:** Always define `permissions` for jobs interacting with the API. Wrap potentially failing commands in loops with `(cmd) || true` or similar logic to allow continuation.
