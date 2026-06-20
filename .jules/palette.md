## 2024-06-20 - Enable native form submission for input-heavy widgets
**Learning:** React patterns often wrap interactive inputs in `<div>` and trigger actions via `onClick` handlers. This breaks the native HTML form behavior where pressing 'Enter' within an input field triggers submission, forcing users to manually click or tab to the submit button.
**Action:** Always wrap logical groups of inputs and their corresponding primary action button in a semantic `<form onSubmit={(e) => { e.preventDefault(); handleAction(); }}>` and ensure the primary button has `type="submit"`.
