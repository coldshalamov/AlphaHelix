## 2024-07-26 - Form Refactoring Risk
**Learning:** When converting <div> wrappers into semantic <form> tags to improve accessibility, always ensure that any nested auxiliary buttons (e.g., 'Max' buttons, toggle switches) explicitly declare type="button". Otherwise, they will default to type="submit" and inadvertently trigger form submissions.
**Action:** Review all child elements of a new <form> to explicitly designate button types.
