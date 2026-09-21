## 2024-05-24 - BettingWidget Form Conversion
**Learning:** Users naturally press "Enter" after typing an amount. Previously, the BettingWidget used a `<div>` wrapper with an `onClick` on the submit button, breaking keyboard accessibility.
**Action:** Converted the `<div>` wrapper to a semantic `<form>` and updated the button to `type="submit"` to natively support "Enter" key submission while preserving disabled state checks in the `onSubmit` handler.
