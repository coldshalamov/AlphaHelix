# Bolt's Journal - Critical Learnings

## 2025-12-16 - [Timer-Driven Re-renders & Hook Safety]
**Learning:** Placing 1Hz timers in parent components (like `MarketDetailPage`) triggers full-tree re-renders, which can expose hook order violations (e.g., conditional returns) and degrade performance.
**Action:** Isolate high-frequency updates (like countdowns) into dedicated leaf components (`Countdown.jsx`) and use `setTimeout` for low-frequency state transitions (like market phases).
