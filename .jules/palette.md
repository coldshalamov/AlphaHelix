## 2024-07-16 - Add Form Submit wrapping for Keyboard Accessibility
**Learning:** React elements with input fields require explicit wrapping in `<form onSubmit={...}>` and a primary `<button type="submit">` to be navigable and submittable via keyboard (e.g. hitting Enter), which is critical for disabled users.
**Action:** Always verify that input-heavy custom UI widgets are properly structured as semantic forms rather than loose inputs and onClick buttons.
