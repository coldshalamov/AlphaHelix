## 2024-05-23 - Visually Hidden Inputs & Focus

**Learning:** When wrapping `.visually-hidden` inputs inside `label` elements styled as buttons, standard `:focus-visible` styles on the label don't trigger because the *input* receives focus, not the label.
**Action:** Use `label.button:has(:focus-visible)` (or `:focus-within` with care) to transfer the focus ring to the visible container.
