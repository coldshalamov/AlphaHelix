## 2024-07-14 - Keyboard Accessibility Pattern for Submissions
**Learning:** Avoid using <div> wrappers with onClick handlers for primary input submissions. Native form submission via the 'Enter' key is heavily relied upon by keyboard users, and its absence severely hampers accessibility and basic usability.
**Action:** Always wrap input-heavy widgets in a semantic `<form onSubmit={...}>` and use a `<button type="submit">` to enable native form submission, taking care to mark auxiliary buttons as `type="button"`.
