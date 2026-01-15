## 2024-01-15 - Network Validation in UX
**Vulnerability:** Users could interact with the `Bank` component (buying/selling HLX) while connected to the wrong blockchain network, leading to potential loss of funds (sending ETH to a wrong address) or wasted gas on failed transactions.
**Learning:** Even if `wagmi` or `viem` handles chain mismatches gracefully in some cases, the UI must explicitly warn and block actions to prevent user confusion and accidental key-signing on the wrong network.
**Prevention:** Implement `useChainId` checks in all wallet-interacting components and disable sensitive actions (Buy/Sell/Commit) when `chainId !== expectedChainId`.
