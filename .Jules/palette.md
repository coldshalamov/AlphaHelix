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

## 2024-05-22 - [Financial Input Unit Accessibility]
**Learning:** Screen readers often announce inputs as just numbers, causing confusion about units (e.g., "0.1" vs "0.1 ETH").
**Action:** Use `aria-describedby` to link the input to its visual unit suffix (e.g., `<span id="unit-eth">ETH</span>`). This provides context without redundant labels.
