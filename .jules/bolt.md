# Bolt's Journal - Critical Learnings

## 2025-12-16 - [Timer-Driven Re-renders & Hook Safety]
**Learning:** Placing 1Hz timers in parent components (like `MarketDetailPage`) triggers full-tree re-renders, which can expose hook order violations (e.g., conditional returns) and degrade performance.
**Action:** Isolate high-frequency updates (like countdowns) into dedicated leaf components (`Countdown.jsx`) and use `setTimeout` for low-frequency state transitions (like market phases).

## 2025-02-19 - [Batched Reads via useReadContracts]
**Learning:** Replacing manual loops of `readContract` + `Promise.all` with `useReadContracts` allows Wagmi to automatically use `multicall` (when available), reducing N RPC requests to 1 and preventing network waterfalls.
**Action:** Use `useReadContracts` for any list fetching instead of iterative fetching.

## 2025-10-24 - [Polling & Memoization]
**Learning:** When using polling hooks like `useReadContracts` with `refetchInterval`, the parent component re-renders on every fetch even if data values are deep-equal (due to new object references). Child components with complex sub-hooks (like `useReadContract` or `useAccount`) should be memoized to prevent cascading re-renders.
**Action:** Wrap expensive or side-effect-heavy child components (like `BettingWidget`) in `React.memo` when placed inside polling pages. Also, always clean up `setTimeout` in `useEffect` to prevent memory leaks during navigation.

## 2025-12-23 - [Redundant Storage Mappings]
**Learning:** `HelixMarket.sol` used a boolean mapping `hasCommitted` alongside `committedAmount` to track user commitments. Since `committedAmount` is always > 0 for valid commitments, the boolean mapping was redundant and wasted ~22k gas per transaction (SSTORE).
**Action:** Always check if an existing numeric mapping can serve as a boolean flag (value > 0) before creating a dedicated boolean mapping.
