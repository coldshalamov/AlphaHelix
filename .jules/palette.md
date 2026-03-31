## 2024-05-22 - Rich Empty State Pattern
**Learning:** Users encounter empty states frequently (e.g., no markets). Plain text feels broken. A standardized "Rich Empty State" pattern (Centered Card + Icon + Title + Description) significantly improves perceived polish and provides better guidance.
**Action:** Replace all plain text empty states (e.g., "No items found") with the standardized Rich Empty State component structure, using existing design tokens for consistency.

## 2024-05-22 - Preventing Flash of Empty Content
**Learning:** When chaining data fetching hooks (e.g., fetching a count then fetching items), dependent hooks may initially return empty data with `isLoading: false` while the primary hook loads, causing a "flash of empty content".
**Action:** Explicitly aggregate all relevant loading states (e.g., `const isLoadingTotal = isCountLoading || isLoadingList`) before rendering the empty state condition.
