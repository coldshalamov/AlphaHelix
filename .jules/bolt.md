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

## 2025-10-25 - [Smart Polling]
**Learning:** Wagmi v2's `refetchInterval` accepts a function `(data) => number | false`. This allows disabling polling dynamically when a terminal state (e.g., market resolution) is reached, saving RPC calls.
**Action:** Use conditional `refetchInterval` logic for entities with final states, and pair with manual `refetch()` for subsequent user actions (like claiming).

## 2025-10-26 - [Form Input Re-renders]
**Learning:** Using inline arrow functions for `onChange` handlers in controlled components (like `Bank.jsx`) creates new function references on every render. Combined with state updates on every keystroke, this causes unnecessary work, especially if the component uses expensive hooks.
**Action:** Memoize event handlers with `useCallback` and wrap form-heavy components in `React.memo` to stabilize function references and isolate re-renders.
