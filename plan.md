1. **Fix Weak Random Seed Generation in `HelixMarket.sol`**
   - In `contracts/HelixMarket.sol`, the initial `s.closeSeed` for random-close markets is generated using only `block.timestamp`, `msg.sender`, `marketId`, and `blockhash(block.number - 1)`. These are predictable and manipulable elements.
   - I will use `replace_with_git_merge_diff` to add `block.prevrandao` to the `keccak256(abi.encodePacked(...))` payload around line 186 in `_submitStatementInternal` to ensure a stronger source of pseudo-randomness in Ethereum Proof-of-Stake.

2. **Verify Changes**
   - Use `sed -n '180,195p' contracts/HelixMarket.sol` to verify the `closeSeed` generation explicitly includes `block.prevrandao`.

3. **Append Learning to Sentinel Journal**
   - Append the learning about `block.prevrandao` to `.jules/sentinel.md` using a heredoc and `$(date +%Y-%m-%d)` for the dynamic date.

4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run `pnpm install`, `pnpm format`, `pnpm lint`, and `pnpm test` to ensure changes are correct and regressions are avoided.
   - Call the `pre_commit_instructions` tool to complete the final checks.

5. **Submit the PR**
   - Use `run_in_bash_session` to execute `gh pr create` with the branch name `sentinel/fix-weak-randomness`.
   - The PR description will strictly include: 🚨 Severity, 💡 Vulnerability, 🎯 Impact, 🔧 Fix, and ✅ Verification.
