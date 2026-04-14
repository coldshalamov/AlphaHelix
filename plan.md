1. **Change input types from `number` to `text` and update sanitization in `frontend/src/components/Bank.jsx`**
   - Update `handleBuyAmountChange` and `handleSellAmountChange` to explicitly replace commas with dots and strip non-numeric/dot characters (e.g., `val = val.replace(/,/g, '.').replace(/[^\d.]/g, '')`).
   - Add explicit comments explaining the sanitization.
   - For `buy-amount` and `sell-amount` inputs, change `type="number"` to `type="text"`, remove `min` and `step` attributes, and add `pattern="^\d*\.?\d*$"`.
2. **Verify changes in `frontend/src/components/Bank.jsx`**
   - Use `sed -n` targeted at the `Bank.jsx` file to visually inspect that the `onChange` handler and input updates were correctly applied.
3. **Change input types from `number` to `text` and update sanitization in `frontend/src/components/BettingWidget.jsx`**
   - Update `handleAmountChange` to replace commas with dots and strip non-numeric/dot characters.
   - Add explicit comments explaining the sanitization.
   - For the `bet-amount` input, change `type="number"` to `type="text"`, remove `min` and `step` attributes, and add `pattern="^\d*\.?\d*$"`.
4. **Verify changes in `frontend/src/components/BettingWidget.jsx`**
   - Use `sed -n` targeted at the `BettingWidget.jsx` file to visually inspect that the `onChange` handler and input updates were correctly applied.
5. **Run tests to verify there are no regressions**
   - Navigate to `frontend` and run `pnpm install`, `pnpm build`, and `pnpm lint`.
6. **Complete pre-commit steps**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
7. **Submit the PR**
   - Create a PR titled "🎨 Palette: Support international keyboards and prevent scroll-jacking on number inputs"
   - Include a description structured with What (💡), Why (🎯), Before/After (📸), and Accessibility (♿) as per the PR formatting directives.
