## 2024-05-23 - Actionable Connect Wallet
**Learning:** Users expect "Connect Wallet" elements in headers to be interactive buttons, not passive status indicators. Using a `div` badge for this state is confusing.
**Action:** Always implement connection triggers as `<button>` elements with `aria-label`, even if they default to the injected provider. Use `useConnect` from wagmi to handle this directly in layout components if necessary.
