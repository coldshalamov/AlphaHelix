## 2024-06-14 - Use <form> for native keyboard submission in Web3 widgets
**Learning:** Web3 dApps in this project frequently use custom `<div>` containers for input forms to handle smart contract actions. This inadvertently breaks native browser form submission using the 'Enter' key.
**Action:** Always wrap input-heavy widgets in a semantic `<form onSubmit={...}>` and use a primary `<button type="submit">` to restore accessibility and expected UX behaviors.
