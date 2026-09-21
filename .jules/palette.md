## 2024-09-15 - Native Keyboard Form Submissions
**Learning:** Converting standard `<div>` wrappers to semantic `<form onSubmit={...}>` wrappers ensures native accessibility by allowing users to submit input-heavy widgets by pressing 'Enter'.
**Action:** Always enforce disabled/locked states within the `onSubmit` handler (e.g., `if (!isLocked) submit()`) because native browser keyboard submissions can bypass `<button type="submit" disabled>` logic.
