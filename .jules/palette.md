## 2024-02-14 - Bank Component Improvements
**Learning:** `Bank.jsx` utilizes a single status message state for multiple actions (Buy and Sell). To maintain accessibility standards, individual inputs must still be programmatically linked to this shared status message via `aria-describedby` to ensure screen readers announce validation errors. Additionally, `aria-invalid` should be derived from the error message content to provide targeted feedback on the specific input that failed.
**Action:** When working with shared status indicators, parse the message content to drive specific `aria-invalid` states on inputs, and always link the status container ID to inputs via `aria-describedby`.

## 2024-02-14 - Max Button Pattern
**Learning:** A "Max" button is a critical affordance in DeFi interfaces (`Bank.jsx`). It should be positioned within the input label line for clarity. Using `type="button"` is mandatory to prevent accidental form submission in a multi-button form context.
**Action:** Use the `.badge` class for auxiliary actions inside labels. Ensure they are explicitly typed as buttons.

## 2026-01-14 - Interactive Wallet Badges
**Learning:** Users expect wallet addresses displayed in headers to be interactive, specifically to copy the full address. Transforming static badges into accessible buttons (`type="button"`, `aria-label`) with feedback ("Copied!") provides a delightful micro-interaction without cluttering the UI.
**Action:** When displaying wallet addresses, wrap them in a button with clipboard functionality and transient feedback.
