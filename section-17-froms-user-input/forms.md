# Forms & User Input in React

Notes for section 17. Every example is taken from the code in `src/`, and each concept was checked against the
official docs (links at the end of each section and in [Sources](#sources)).

## Overview — which approach when

| Approach | How you read values | Re-render on each keystroke | Best for |
| --- | --- | --- | --- |
| `useState` (controlled inputs) | state variables | yes | live validation, UI that reacts while the user types |
| `useRef` (uncontrolled) | `ref.current.value` on submit | no | few fields, read once on submit |
| `FormData` (uncontrolled) | `new FormData(form)` on submit | no | **most forms**, many fields, plain submit |
| React 19 form actions | `formData` argument of the action | no | React 19+, async submit, pending state |

---

## 1. Submitting a form

### 1.1 The browser default: a `<button>` inside a `<form>` submits it

A `<button>` without a `type` inside a `<form>` is `type="submit"` by default. Clicking it makes the browser
**send an HTTP request and reload the page**. With no `action`/`method` on the form, it is a `GET` to the current
URL, and the named fields end up in the query string:

```text
http://localhost:5173/?email=&password=
```

In a React SPA that reload wipes the app state, so you must stop it.

### 1.2 Fixes

From the comments in `src/components/LoginUseRefApproach.jsx:11-14`:

1. `type="button"` on the button — works, but then the button no longer submits, and **Enter** in an input does
   not submit either.
2. **Better:** listen on the form with `onSubmit` and call `event.preventDefault()`. This catches every way the
   form can be submitted (button click, Enter key).

```jsx
// src/components/LoginUseRefApproach.jsx
function handleSubmit(event) {
  event.preventDefault(); // stop the browser from sending a request + reloading
  // ...read the values here
}

return <form onSubmit={handleSubmit}>...</form>;
```

> React 19 alternative: pass a function to `<form action={...}>` — then you need neither `onSubmit` nor
> `preventDefault()`. See [section 8](#8-react-19-form-actions).

### 1.3 Button types

| `type` | What it does |
| --- | --- |
| `submit` (default) | submits the form |
| `reset` | resets all fields to their initial values |
| `button` | nothing — only your own `onClick` |

⚠️ In `LoginUseRefApproach.jsx`, `LoginUseStateApproach.jsx` and `LoginUseInputHookApproach.jsx` the
**Reset** button has no `type`, so it is a *submit* button — clicking "Reset" submits the form.
`Signup.jsx:138` does it right with `type="reset"`.

Docs: [MDN `<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button),
[react.dev `<input>` — reading values on submit](https://react.dev/reference/react-dom/components/input)

---

## 2. Reading the values — three approaches

### 2.1 `useState` — controlled inputs

The input shows whatever is in state (`value`), and every keystroke updates state (`onChange`). React docs: if you
pass `value` **without** `onChange`, the field becomes read-only and React logs a warning.

**One state object for all fields** instead of one `useState` per field —
`src/components/LoginUseStateApproach.jsx:9-33`:

```jsx
const [enteredValues, setEnteredValues] = useState({
  email: "",
  password: "",
});

// to pass 'identifier' we need: onChange={(event) => handleInputChange("email", event.target.value)}
function handleInputChange(identifier, value) {
  setEnteredValues((prevValues) => ({
    ...prevValues,        // keep the other fields
    [identifier]: value,  // computed property name: the key is the *value* of identifier ("email" / "password")
  }));
}

<CustomInput
  onChange={(event) => handleInputChange("email", event.target.value)}
  value={enteredValues.email}
/>
```

Key points:

- **Arrow function in `onChange`** — `onChange` only ever passes the `event`. To pass an extra argument
  (`"email"`), wrap the call: `(event) => handleInputChange("email", event.target.value)`.
- **`[identifier]: value`** — square brackets in an object literal make a *computed key*:
  `{ [identifier]: value }` with `identifier = "email"` → `{ email: value }`. Without brackets you'd get a key literally
  named `identifier`.
- **Updater function `prevValues => ...`** — React docs recommend it when the new state depends on the old state.
- Use `""` (not `undefined`/`null`) as the initial value, otherwise React switches the input from uncontrolled to
  controlled and warns.

Docs: [react.dev `<input>` — controlled input](https://react.dev/reference/react-dom/components/input#controlling-an-input-with-a-state-variable),
[MDN computed property names](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#computed_property_names)

### 2.2 `useRef` — read the DOM on submit

Less code: no state, no `onChange`. React fills `ref.current` with the DOM node once the element is on screen, and
you read `.value` in the event handler — `src/components/LoginUseRefApproach.jsx`:

```jsx
const email = useRef();
const password = useRef();

function handleSubmit(event) {
  event.preventDefault();
  const enteredEmail = email.current.value;
  const enteredPassword = password.current.value;
  console.log(enteredEmail, enteredPassword);
}

<input id="email" type="email" name="email" ref={email} />
```

- **Changing a ref does not re-render** — great for reading on submit, useless for showing live errors.
- Read refs **in event handlers or effects**, not during rendering (react.dev rule).
- **Downside: resetting.** You end up writing `email.current.value = ""` — directly mutating the DOM, which
  React should own. Better: `event.target.reset()` (section 3).
- Many fields = many refs. That is where `FormData` wins.

Docs: [react.dev `useRef` — manipulating the DOM](https://react.dev/reference/react/useRef#manipulating-the-dom-with-a-ref)

### 2.3 `FormData` — the built-in browser way (best for most forms)

`src/components/Signup.jsx:8-31`:

```jsx
function handleSubmit(event) {
  event.preventDefault();

  // every input MUST have a `name` attribute, e.g. name="email" — fields without one are ignored
  const fd = new FormData(event.target); // event.target is the <form>

  // one by one — repetitive:
  // const enteredEmail = fd.get("email");

  // all at once — fd.entries() gives [name, value] pairs, Object.fromEntries turns them into an object
  const data = Object.fromEntries(fd.entries());

  // several checkboxes with the same name → fromEntries would keep only the LAST one, so use getAll()
  data.acquisition = fd.getAll("acquisition"); // ["google", "friend"]

  // "confirm-password" has a dash → dot notation (data.confirm-password) would be a subtraction; use brackets
  if (data.password !== data["confirm-password"]) { ... }
}
```

What the browser puts into `FormData` (HTML spec, "constructing the entry list"):

- only fields with a non-empty `name`;
- **disabled** fields are skipped;
- **unchecked** checkboxes/radios are skipped — an unchecked "terms" box is *missing* from `data`, not `false`;
- for a checked checkbox without a `value` attribute the value is the string `"on"` (e.g. `data.terms === "on"`).

`get` vs `getAll`:

```js
fd.get("acquisition");    // "google"            — first value only
fd.getAll("acquisition"); // ["google", "friend"] — all values
```

Duplicate keys in `Object.fromEntries`: the **last** pair wins (`Object.fromEntries([["a",1],["a",2]])` →
`{ a: 2 }`, verified in Node). That is why the checkbox group needs `getAll`.

Docs: [react.dev `<input>` — reading the input values when submitting a form](https://react.dev/reference/react-dom/components/input#reading-the-input-values-when-submitting-a-form),
[MDN `FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData),
[MDN `Object.fromEntries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries),
[HTML spec — constructing the entry list](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-form-data-set)

---

## 3. Resetting the form

| Approach | How to reset |
| --- | --- |
| uncontrolled (`ref` / `FormData`) | `<button type="reset">` or `event.target.reset()` |
| `useState` | set the state back: `setEnteredValues({ email: "", password: "" })` |
| React 19 `action` | automatic — React resets uncontrolled fields after the action succeeds |

```jsx
// src/components/Signup.jsx:30-31 — after a successful submit
event.target.reset(); // HTMLFormElement.reset(): restores every field's default value
```

```jsx
// src/components/Signup.jsx:138
<button type="reset" className="button button-flat">Reset</button>
```

`reset()` restores the **default** values (`defaultValue` / the HTML `value` attribute), not "empty". It does not reset
React state — e.g. `passwordsAreNotEqual` in `Signup.jsx` stays `true` until you set it back yourself.

Docs: [MDN `HTMLFormElement.reset()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset)

---

## 4. Validation

### 4.1 On every keystroke — not recommended alone

Derive the error from state on every render. Problem: the error shows **too early** — as soon as the user types the
first letter of an email, "invalid email" appears.

```jsx
const emailIsInvalid = enteredValues.email !== "" && !enteredValues.email.includes("@");
```

### 4.2 On blur (lost focus) — not recommended alone

Validate when the field loses focus (`onBlur`). Problem: the error stays **too long** — after the user starts fixing
it, it is still shown until they leave the field again.

### 4.3 Combine both: `didEdit` flag

Track whether the user has *finished* editing a field (`didEdit`), set it to `true` on blur and back to `false` on a
new keystroke. Error = `didEdit && !isValid`. Result: no error while typing, error after leaving the field, error
disappears as soon as the user types again. This is exactly what `useInput` does (section 7):

```js
// src/hooks/useInput.js
function handleInputChange(event) {
  setEnteredValue(event.target.value);
  setDidEdit(false); // user is typing again → hide the error
}

function handleInputBlur() {
  setDidEdit(true);  // user left the field → now show the error, if any
}

return { ..., hasError: didEdit && !valueIsValid };
```

### 4.4 Built-in browser validation — best for simple rules

The browser validates these attributes **on submit**, blocks the submit and shows its own message — no JS needed.
`src/components/Signup.jsx`:

```jsx
{/* required + type="email" → must be non-empty AND look like an email */}
<input id="email" type="email" name="email" required />

<input id="password" type="password" name="password" minLength={8} required />

{/* a required checkbox must be checked */}
<input type="checkbox" id="terms-and-conditions" name="terms" required />
```

| Attribute | Rule |
| --- | --- |
| `required` | must have a value / checkbox must be checked |
| `type="email"` | must be a syntactically valid email |
| `minLength` / `maxLength` | number of characters (only checked on user-typed input) |
| `min` / `max` | numeric / date range |
| `pattern` | must match a regular expression |

- In JSX the attribute is camelCase: `minLength={8}` (HTML: `minlength="8"`).
- Add `noValidate` to `<form>` to turn this off.
- Client-side validation is a UX feature — **always validate again on the server** (MDN).

### 4.5 Mixing built-in and custom validation

Some rules HTML attributes can't express, e.g. "confirm password must equal password". Let the browser handle
`required`/`minLength`, and check the rest yourself in `handleSubmit` — `src/components/Signup.jsx:22-26, 66-68`:

```jsx
if (data.password !== data["confirm-password"]) {
  setPasswordsAreNotEqual(true);
  return; // stop: don't submit, don't reset
}

{passwordsAreNotEqual && <div className="control-error">Passwords must match</div>}
```

Alternative from the platform: `input.setCustomValidity("Passwords do not match")` turns a custom rule into a
built-in one (same browser message, blocks submit). An empty string `""` clears the error — you must clear it when
the values match, otherwise the form stays invalid forever.

Docs: [MDN constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation)

---

## 5. Reusable input component

Repeating label + input + error markup for every field gets noisy. Pull it into one component —
`src/components/CustomInput.jsx`:

```jsx
export default function CustomInput({ label, id, error, ...props }) {
  return (
    <div className="control no-margin">
      {/* "htmlFor" is the JSX name for the HTML "for" attribute */}
      <label htmlFor={id}>{label}</label>
      <input id={id} {...props} />
      <div className="control-error">{error && <p>{error}</p>}</div>
    </div>
  );
}
```

- **`...props` (rest)** collects every other prop (`type`, `value`, `onChange`, `onBlur`, …), and **`{...props}`
  (spread)** forwards them all to `<input>` — the component doesn't need to know them.
- **`htmlFor`** — `for` is a reserved word in JS, so JSX uses `htmlFor` (same reason as `className`). It links the
  label to the input with the same `id`: clicking the label focuses the input, and screen readers read the label.
  react.dev prefers nesting `<input>` inside `<label>`; if you use `id` + `htmlFor` in a reusable component, generate the
  id with `useId()` so two instances on one page don't clash.
- `error={emailHasError && "Please enter a valid email"}` — `false && "..."` is `false`, which React renders as nothing.

⚠️ The current `CustomInput.jsx:5` renders the hard-coded text `Email` instead of `{label}`, so the password field is
also labelled "Email".

Docs: [react.dev `<input>` — providing a label](https://react.dev/reference/react-dom/components/input#providing-a-label-for-an-input),
[react.dev `useId`](https://react.dev/reference/react/useId)

---

## 6. Outsource validation logic into utils

Plain functions, no React — easy to reuse and test — `src/util/validation.js`:

```js
export function isEmail(value)              { return value.includes("@"); }
export function isNotEmpty(value)           { return value.trim() !== ""; }
export function hasMinLength(value, min)    { return value.length >= min; }
export function isEqualsToOtherValue(a, b)  { return a === b; }
```

Combine them where you use them:

```js
useInput("", (value) => isEmail(value) && isNotEmpty(value));
useInput("", (value) => hasMinLength(value, 6));
```

These functions call no hooks, so per react.dev they must **not** get the `use` prefix.

⚠️ In `LoginUseStateApproach.jsx:19-22` the rule is `!isEmail(...) && !isNotEmpty(...)` — invalid only if it is
*both* empty *and* has no `@`, so `"abc"` passes. Correct: `!isEmail(v) || !isNotEmpty(v)`.

---

## 7. Custom hook — `useInput`

The value state, the `didEdit` state, both handlers and the error logic are the same for every field. A custom hook
packages that **stateful logic** — `src/hooks/useInput.js`:

```js
export function useInput(defaultValue, validationFn) {
  const [enteredValue, setEnteredValue] = useState(defaultValue);
  const [didEdit, setDidEdit] = useState(false);

  const valueIsValid = validationFn(enteredValue); // derived on every render, not stored

  function handleInputChange(event) { setEnteredValue(event.target.value); setDidEdit(false); }
  function handleInputBlur()        { setDidEdit(true); }

  return { value: enteredValue, handleInputChange, handleInputBlur, hasError: didEdit && !valueIsValid };
}
```

Used once per field, renaming on destructuring — `src/components/LoginUseInputHookApproach.jsx:7-19`:

```jsx
const {
  value: emailValue,                 // rename `value` → `emailValue`
  handleInputChange: handleEmailChange,
  handleInputBlur: handleEmailBlur,
  hasError: emailHasError,
} = useInput("", (value) => isEmail(value) && isNotEmpty(value));

const { value: passwordValue, /* ... */ hasError: passwordHasError } =
  useInput("", (value) => hasMinLength(value, 6));
```

- **Name must start with `use` + capital letter** — that tells React (and the linter) the function calls hooks.
- **Logic is shared, state is not**: each `useInput(...)` call has its own independent state — calling it twice is like
  writing two `useState`s by hand.
- `{ value: emailValue }` is destructuring with rename — needed because both calls return a key called `value`.
- The validation rule is passed in as a function (`validationFn`) so the hook works for any field.
- `valueIsValid` is **derived** from state, not a separate state — never store what you can compute.

⚠️ `handleSubmit` only checks `hasError`, which is `false` until a field was blurred — so submitting an untouched,
empty form passes. Check validity directly on submit (e.g. also return `isValid` from the hook).

Docs: [react.dev — Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## 8. React 19 form actions

Comment in the code: *"instead of event, React 19 has form actions"*. In React 19 the `action` prop of `<form>` can be
a **function**. React then:

- calls it with a `FormData` of every field with a `name` — no `onSubmit`, no `preventDefault()`, inputs can be
  uncontrolled;
- runs it in a Transition (can be `async`);
- **resets the uncontrolled fields automatically** when the function succeeds.

```jsx
function signupAction(formData) {
  const email = formData.get("email");
  const acquisition = formData.getAll("acquisition");
  // ...
}

<form action={signupAction}>
  <input name="email" type="email" required />
  <button type="submit">Sign up</button>
</form>
```

### `useActionState` — action + state (e.g. validation errors)

```jsx
import { useActionState } from "react";

function signupAction(prevState, formData) {   // prevState first, formData second!
  const password = formData.get("password");
  if (password !== formData.get("confirm-password")) {
    return { errors: ["Passwords must match"] };
  }
  return { errors: null };
}

const [state, formAction, isPending] = useActionState(signupAction, { errors: null });

<form action={formAction}>
  ...
  {state.errors && <p className="control-error">{state.errors[0]}</p>}
</form>
```

- Returns `[state, dispatchAction, isPending]`. `state` is `initialState` on the first render, then whatever the action
  returned last.
- Because the form is reset after the action, typed values disappear even on a validation error. To keep them, return
  them in the state and pass them back as `defaultValue`.

### `useFormStatus` — pending state in a child

```jsx
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus(); // must be rendered INSIDE the <form>
  return <button disabled={pending}>{pending ? "Submitting..." : "Submit"}</button>;
}
```

Docs: [react.dev `<form>`](https://react.dev/reference/react-dom/components/form),
[react.dev `useActionState`](https://react.dev/reference/react/useActionState),
[react.dev `useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus)

---

## 9. Libraries

For large forms (many fields, nested data, schema validation), a library saves the boilerplate above:

- [React Hook Form](https://react-hook-form.com/) — uncontrolled inputs + refs, few re-renders.
- [Formik](https://formik.org/) — controlled-input based.

Both integrate with schema validators such as [Zod](https://zod.dev/) or [Yup](https://github.com/jquense/yup).

---

## 10. Known issues in this section's code

Found while extracting the examples; the code is left as is.

- `App.jsx:2` imports `LoginUseStateApproach.jsx` under the name `LoginUseInputHookApproach` — the rendered form is the
  `useState` version, not the hook version.
- `CustomInput.jsx:5` — label text hard-coded to `Email` instead of `{label}`.
- `LoginUseStateApproach.jsx:35` — `handleInputBlur` is empty, so `didEdit` never becomes `true` and no error ever
  shows; `:19-22` uses `&&` where `||` is needed; `:45` logs the unused `enteredEmail` / `enteredPassword` state.
- Login components — the "Reset" button has no `type`, so it submits.
- `LoginUseInputHookApproach.jsx` — an untouched empty form passes validation (section 7).
- `Signup.jsx:87` — `<label htmlFor="phone">` but the `<select>` has `id="role"`; `passwordsAreNotEqual` is never set
  back to `false`.

---

## Sources

- react.dev — [`<form>`](https://react.dev/reference/react-dom/components/form),
  [`<input>`](https://react.dev/reference/react-dom/components/input),
  [`useRef`](https://react.dev/reference/react/useRef),
  [`useActionState`](https://react.dev/reference/react/useActionState),
  [`useFormStatus`](https://react.dev/reference/react-dom/hooks/useFormStatus),
  [`useId`](https://react.dev/reference/react/useId),
  [Custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- MDN — [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData),
  [`<button>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button),
  [`HTMLFormElement.reset()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset),
  [Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Constraint_validation),
  [`Object.fromEntries`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries)
- HTML spec — [constructing the entry list](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-form-data-set)
