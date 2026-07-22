## 2024-05-22 - [Navigation Accessibility]
**Learning:** React Router / Next.js Links often rely solely on CSS classes for active states, leaving screen reader users unaware of their current location.
**Action:** Always include `aria-current="page"` on the active navigation item to provide semantic context alongside visual styling.

## 2024-05-24 - [Semantic Choice Patterns]
**Learning:** Users scan Yes/No options faster when they use semantic colors (Green/Red) rather than generic active/inactive states.
**Action:** Use `primary` (success) and `danger` variants for positive/negative boolean choices instead of generic toggle styles.

## 2024-05-25 - [Active Recovery]
**Learning:** Passive error messages ("Wrong network") leave users stranded, forcing them to figure out the solution manually.
**Action:** Always provide an action button (e.g., "Switch Network") directly within the error state to allow immediate recovery.

## 2024-10-24 - [Local Secret Anxiety]
**Learning:** Users in commit-reveal systems fear losing their local storage (and thus funds). A simple "Backup Secret" button provides immense psychological safety.
**Action:** When handling local-only secrets, always provide a one-click "Copy Backup" action in the success state.

## 2024-10-25 - [Input Suffix Patterns]
**Learning:** Users often lose context of the unit (ETH vs HLX) inside bare inputs. A visual suffix inside the input field reduces cognitive load.
**Action:** Wrap financial inputs in a relative container and place an absolute-positioned unit label (with `pointer-events: none`) inside the right edge.

## 2026-03-29 - [Contextual Focus for Helper Buttons]
**Learning:** Users can lose their place when clicking helper buttons (like 'Max' balance fillers) that modify input values if focus isn't managed.
**Action:** Helper buttons that modify input values must explicitly shift focus to the modified input field using `useRef` and `.focus()` (wrapped in a `setTimeout`) to maintain context and provide immediate feedback for assistive technologies.

## 2024-05-25 - [Form Submission Accessibility]
**Learning:** Using `<div>` wrappers and `onClick` handlers for financial inputs prevents users from submitting forms natively using the 'Enter' key.
**Action:** Always use semantic `<form onSubmit={...}>` wrappers and `<button type="submit">` for input-heavy widgets to ensure native keyboard accessibility.
## 2024-05-30 - [Form Submission Accessibility Regression]
**Learning:** Wrapping interactive input-heavy widgets in a semantic `<form onSubmit={...}>` ensures native keyboard accessibility, allowing users to submit by pressing 'Enter'. However, when introducing a `<form>`, all sibling `<button>` elements within it will default to `type="submit"` unless explicitly set to `type="button"`. Failing to do so can cause unintentional form submissions (e.g., clicking a "Max" button).
**Action:** When implementing semantic `<form>` tags, always verify that all non-submission utility buttons inside the form explicitly include `type="button"`.
