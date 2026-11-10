# React 19 — Notes & Interview Questions

A reminder and interview-prep guide built from my own notes and from the comments I left in the
`section-*` projects. Every entry is a numbered question; click **more-info** to reveal the answer.
Each answer says *what* it is, *why* it exists, *how* it works, and points to the file where I used it.

## Sections

- [Section 01 — React Essentials (components, props, state, events)](#section-01--react-essentials)
- [Section 04 — Tic-Tac-Toe (state updates, immutability, derived state)](#section-04--tic-tac-toe)
- [Section 05 — Investment Calculator (forms, inputs)](#section-05--investment-calculator)
- [Section 06 — Styling (styled-components, Tailwind)](#section-06--styling)
- [Section 07 — Debugging (StrictMode)](#section-07--debugging)
- [Section 08 — Refs & Portals](#section-08--refs--portals)
- [Section 10 — Context API & useReducer](#section-10--context-api--usereducer)
- [Section 11 — useEffect & side effects](#section-11--useeffect--side-effects)
- [Section 12 — Optimization & how React renders](#section-12--optimization--how-react-renders)

---

## Section 01 — React Essentials

### 1. What is a React component and what does React do with it?

<details>
<summary>more-info</summary>

**What:** a component is a plain JavaScript function whose name starts with an uppercase letter
and which returns JSX.

**How it works:** React does not "run your page". It *calls your function* and gets back a
description of the UI (JSX compiles to `jsx("h1", {...})` objects). React compares that
description with what is on screen and only touches the DOM where something differs.
Every time the component's state (or its parent) changes, React calls the function **again** —
that is a *render*.

**Why uppercase:** React uses the first letter to tell a component (`<Header />` → call the
`Header` function) from a built-in element (`<header>` → create a DOM `<header>` tag).

```jsx
// section-01-starting-project/src/App.jsx
function App() {
  console.log(`App component is rendered!`); // runs on every render
  return (
    <>
      <Header />
      <main>
        <CoreConcepts />
        <Examples />
      </main>
    </>
  );
}
```

`<>...</>` is a **Fragment**: a wrapper that satisfies "return one root element" without adding
an extra `<div>` to the DOM.

</details>

### 2. What is a Hook? What is the rule for using it?

<details>
<summary>more-info</summary>

**What:** every function whose name starts with `use` (`useState`, `useRef`, `useEffect`, …)
is a Hook — a special function that lets a component "hook into" React features
(state, lifecycle, context).

**Rules of Hooks:**

1. Call them only at the **top level** of a component or a custom Hook — never inside `if`,
   loops, nested functions or event handlers.
2. Call them only from React function components or other Hooks.

**Why:** React does not know your Hooks by name. It remembers them **by call order**
(1st Hook, 2nd Hook, …). If an `if` skips one Hook on some render, every Hook after it gets the
wrong stored value.

> The one exception is `use` from React 19 — see question [38](#38-what-is-the-use-api-in-react-19-and-why-is-it-allowed-inside-if).

</details>

### 3. What is `useState` and how does it work?

<details>
<summary>more-info</summary>

**What:** a Hook that gives a component memory that survives re-renders.

```jsx
// section-01-starting-project/src/components/Examples/Examples.jsx:8
const [selectedTab, setSelectedTab] = useState();
```

It returns an array with two elements:

- `selectedTab` — the current value for **this** render,
- `setSelectedTab` — a function that *schedules* a new value and asks React to re-render.

**How:** React stores the value outside your function (see question [50](#50-where-does-react-store-state-and-what-does-key-have-to-do-with-it)). On the
first render it uses the argument you passed (`undefined` here); on every later render it ignores
the argument and hands back what it stored.

**Why not a normal variable:** `let selectedTab` would be re-created on every call of
`Examples()` and changing it would not trigger a re-render, so the screen would never update.

</details>

### 4. To run code when an event happens, which value must be passed to an event prop like `onClick`?

<details>
<summary>more-info</summary>

**A function reference** (a pointer to the function), **not** the result of calling it.

```jsx
<button onClick={handleClick}>   // ✅ React calls it later, on click
<button onClick={handleClick()}> // ❌ runs immediately during render
```

**Why:** JSX is evaluated during render. `handleClick()` would execute while React is building
the UI and pass its *return value* (usually `undefined`) to `onClick`.

</details>

### 5. How do you "configure" an event handler — for example, pass it your own arguments?

<details>
<summary>more-info</summary>

Wrap the call in an **arrow function**. The arrow function is the reference React stores; your
real function is only called inside it, when the click happens.

```jsx
// section-01-starting-project/src/components/Examples/Examples.jsx:40
<TabButton
  isSelected={selectedTab === "components"}
  onClick={() => handleTabSelect("components")}
>
  Components
</TabButton>
```

Same pattern with several arguments:

```jsx
// section-04-tic-tac-toe-starting-project/src/Components/GameBoard/GameBoard.jsx:38
onClick={() => onSelectSquare(rowIndex, colIndex)}
```

</details>

### 6. What is `children` and what is a "slot"?

<details>
<summary>more-info</summary>

**`children`** is a special prop: whatever you put *between* a component's opening and closing
tags.

**A slot** is the same idea, but through a named prop — so one component can receive several
separate blocks of JSX.

```jsx
// section-01-starting-project/src/components/Tabs/Tabs.jsx
export default function Tabs({ children, buttons, ButtonsContainer = "menu" }) {
  // buttons are a SLOT, they come from Examples.jsx
  return (
    <>
      <ButtonsContainer>{buttons}</ButtonsContainer>
      {children}
    </>
  );
}
```

In `Examples.jsx` the `buttons` prop receives a Fragment with four `<TabButton>`s, and
`{tabContent}` between `<Tabs>…</Tabs>` becomes `children`.

**Why:** the layout (where buttons go, where content goes) lives in `Tabs`; the content lives
in the caller. `Tabs` can be reused for any set of tabs.

</details>

### 7. How do you pass a component (or an HTML tag) as a prop? Why must the prop name be capitalized?

<details>
<summary>more-info</summary>

```jsx
// section-01-starting-project/src/components/Examples/Examples.jsx:35
<Tabs ButtonsContainer="menu" buttons={...}>
```

```jsx
// Tabs.jsx
<ButtonsContainer>{buttons}</ButtonsContainer>
```

- **Built-in element** → pass its name as a string: `"menu"`, `"div"`, `"ul"`.
- **Custom component** → pass the function itself: `ButtonsContainer={MyButtonContainer}`.

**Why UpperCamelCase:** inside `Tabs`, JSX `<ButtonsContainer>` is compiled to
`jsx(ButtonsContainer, …)` — a variable lookup. With a lowercase name `<buttonsContainer>` JSX
would compile to the *string* `"buttonsContainer"` and React would try to create an unknown
HTML tag.

The same trick appears in section 12:

```jsx
// section-12-optimization/src/components/UI/IconButton.jsx:7
const Icon = icon;          // rename lowercase prop to an uppercase variable
<Icon className="button-icon" />
```

</details>

### 8. What does `...forwardedProps` (rest/spread props) do and why is it useful?

<details>
<summary>more-info</summary>

**What:** in the parameter list, `...forwardedProps` (rest) collects *every prop you did not
name*. In JSX, `{...forwardedProps}` (spread) puts them all back onto an element.

```jsx
// section-01-starting-project/src/components/Section.jsx
export default function Section({ title, children, ...forwardedProps }) {
  return (
    <section {...forwardedProps}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

// Examples.jsx — id and className land in forwardedProps
<Section title="Examples" id="examples" className="examples">
```

```text
props            = { title, children, id, className }
forwardedProps   = {                  id, className }  → spread onto <section>
```

**Why:** the wrapper component does not have to list every possible HTML attribute
(`id`, `className`, `onClick`, `aria-*` …). It stays flexible and reusable.
`TabButton.jsx` uses the same trick to forward `onClick` from `Examples.jsx` to the real
`<button>`.

</details>

### 9. How do you render a list, and why does each item need a `key`?

<details>
<summary>more-info</summary>

Use `.map()` to turn an array of data into an array of JSX elements:

```jsx
// section-01-starting-project/src/components/CoreConcepts/CoreConcepts.jsx:9
{CORE_CONCEPTS_ARRAY.map((conceptItem) => (
  <CoreConcept key={conceptItem.title} {...conceptItem} />
))}
```

`{...conceptItem}` spreads `title`, `description`, `image` as separate props.

**Why `key`:** React uses the key to recognize the *same* item between renders. Without a stable
key it falls back to the position (index); after inserting or removing an item, state ends up
attached to the wrong element. More in question [51](#51-why-must-list-keys-be-unique-and-stable).

</details>

### 10. How should a React project be structured?

<details>
<summary>more-info</summary>

Split components **by feature**, and keep a component's styles next to it:

```text
src/
  components/
    Header/
      Header.jsx
      Header.css
    CoreConcept/
      CoreConcept.jsx
      CoreConcept.css
  store/                ← context + reducers (section 10)
  util/                 ← pure helpers, no JSX (section 05)
```

**Why:** one component = one responsibility. Small components are easier to read, reuse and test,
and — important for performance (section 12) — a state change only re-renders the component that
owns that state and its children. Keep state as low in the tree as possible.

</details>

---

## Section 04 — Tic-Tac-Toe

### 11. Why should you use the function form `setX(prev => …)` when the new state depends on the old one?

<details>
<summary>more-info</summary>

```jsx
// section-04-tic-tac-toe-starting-project/src/Components/Player/Player.jsx:11
function handleEditClick() {
  // setIsEditing(!isEditing);           ❌ uses the value from THIS render
  setIsEditing((editing) => !editing);   // ✅ React passes the latest value
}
```

**How it works:** `isEditing` is a plain `const` captured when `Player()` was called.
`setIsEditing` does not change it — it only *schedules* an update (see question
[49](#49-why-does-consolelog-right-after-setstate-show-the-old-value)). If two updates are queued
in the same click, both read the same old `isEditing`:

```text
isEditing = false
setIsEditing(!isEditing)   → queue: "set true"
setIsEditing(!isEditing)   → queue: "set true"      result: true  ❌ (expected false)

setIsEditing(e => !e)      → queue: "flip"
setIsEditing(e => !e)      → queue: "flip"          result: false ✅
```

**Rule:** new value depends on the old one → pass a function.

</details>

### 12. Why must you never mutate state directly? How do you copy arrays and objects correctly?

<details>
<summary>more-info</summary>

**Why:** React decides whether to re-render by comparing the old and new value with `Object.is`
(a reference check). If you mutate the existing array, the reference is the same → React thinks
nothing changed. You also corrupt the "previous" value other code may still read.

**Spread copies only one level (shallow copy).** A nested array/object is still shared:

```js
const initialGameBoard = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
];

const shallow = [...initialGameBoard];          // new outer array, SAME inner rows ❌
const board   = initialGameBoard.map((row) => [...row]);   // copies every row ✅
```

```jsx
// section-04-tic-tac-toe-starting-project/src/App.jsx:58 — deep copy of an array
let gameBoard = [...INITIAL_GAME_BOARD.map((array) => [...array])];
```

**Nested object** — copy every level you change:

```js
const updated = {
  ...original,
  address: { ...original.address, city: "Niš" },
};
```

**`structuredClone()`** (built into the browser) also makes a full deep copy, but it copies
*everything*, including parts that did not change. React works best when unchanged parts keep their
reference (`memo` and `useMemo` rely on it), so prefer copying only the path you change.

</details>

### 13. What is "lifting state up"?

<details>
<summary>more-info</summary>

**What:** when two sibling components need the same data, move the state to their **closest
common parent** and pass it down as props (plus a function to change it).

In Tic-Tac-Toe, `GameBoard` and `Log` both need the list of turns, so `gameTurns` lives in
`App`:

```jsx
// section-04-tic-tac-toe-starting-project/src/App.jsx:74
const [gameTurns, setGameTurns] = useState([]);
...
<GameBoard onSelectSquare={handleSelectSquareApp} board={gameBoard} />
<Log turns={gameTurns} />
```

The commented-out code in `GameBoard.jsx:2-27` is the "before" version — `GameBoard` had its own
`gameBoard` state, which `Log` could not see. It was moved to `App.jsx`.

</details>

### 14. What is derived (computed) state and why prefer it over extra `useState`?

<details>
<summary>more-info</summary>

**What:** a value you can *calculate* from existing state should not have its own state.
Calculate it during render.

```jsx
// section-04-tic-tac-toe-starting-project/src/App.jsx:73-82
// const [activePlayer, setActivePlayer] = useState("X");   ← removed
const [gameTurns, setGameTurns] = useState([]);

const activePlayer = deriveActivePlayer(gameTurns);
const gameBoard    = deriveGameBoard(gameTurns);
const winner       = deriveWinner(gameBoard, players);
const hasDraw      = gameTurns.length === 9 && !winner;
```

**Why:** one source of truth. With two states (`gameTurns` and `activePlayer`) you must keep them
in sync manually; one missed `setActivePlayer` and the UI shows a wrong player. A derived value is
always correct because it is recomputed on every render ("App will re-execute after every turn").

**Bonus — why the helpers live outside `App`:** a function declared outside the component is
created once when the module loads. Inside the component it would be re-created on every render.
They also don't need anything from the component scope.

</details>

### 15. Why does Player call `onChangeName` only when clicking "Save", not on every keystroke?

<details>
<summary>more-info</summary>

```jsx
// section-04-tic-tac-toe-starting-project/src/Components/Player/Player.jsx:14-19
setIsEditing((editing) => !editing);

if (isEditing) {
  // to not execute on every user stroke
  onChangeName(symbol, playerName);
}
```

The input updates local state (`playerName`) on every keystroke — that only re-renders `Player`.
Lifting the name to `App` on every key would re-render the whole game. So the name is sent up
only once, when the user clicks **Save**.

**Subtle point:** `isEditing` here is still the *old* value (the toggle was only scheduled).
`true` means "we were editing, so this click is Save".

</details>

### 16. How do you update one key of an object in state using a dynamic key?

<details>
<summary>more-info</summary>

Use a **computed property name** `[variable]` inside a new object:

```jsx
// section-04-tic-tac-toe-starting-project/src/App.jsx:106
function handlePlayersNameChange(symbol, newName) {
  setPlayers((prevPlayers) => ({
    ...prevPlayers,       // copy X and O
    [symbol]: newName,    // overwrite only "X" or only "O"
  }));
}
```

`[symbol]` means "use the *value* of `symbol` as the key", so `symbol = "O"` updates `O`.
Without brackets the key would literally be `"symbol"`.

</details>

---

## Section 05 — Investment Calculator

### 17. What type is an input's value, even for `type="number"`? How do you store a number?

<details>
<summary>more-info</summary>

**Always a string.** `event.target.value` comes from the DOM, and DOM input values are strings —
`type="number"` only affects the on-screen keyboard and validation.

```jsx
// section-05-essentials-practice-project-1/src/Components/UserInput/UserInput.jsx:18
<input
  type="number"
  required
  value={userInput.annualInvestment}
  onChange={(e) => handleChange("annualInvestment", e.target.value)}
/>
```

Convert it with unary `+` before storing:

```jsx
// section-05-essentials-practice-project-1/src/App.jsx:17
const handleChange = (inputIdentifier, newValue) => {
  setUserInput((prevUserInput) => ({
    ...prevUserInput,
    [inputIdentifier]: +newValue,   // "1200" → 1200
  }));
};
```

**What breaks without it:** `"10000" + 1200` → `"100001200"` (string concatenation). The
calculator shows absurd numbers, with no error in the console.

</details>

### 18. What is a controlled input?

<details>
<summary>more-info</summary>

An input whose `value` comes from React state and whose `onChange` updates that state:

```text
state ──value──▶ <input>  ──onChange──▶ setState ──▶ re-render ──▶ new value shown
```

React state is the single source of truth. In section 05 the state lives in `App` and
`UserInput` only receives `userInput` and `handleChange` as props (lifting state up — question
[13](#13-what-is-lifting-state-up)).

The opposite — reading the DOM value only when needed — is an **uncontrolled** input, done with a
ref (question [27](#27-what-is-useref-and-why-do-you-always-need-current)).

</details>

### 19. How do you render something conditionally in JSX?

<details>
<summary>more-info</summary>

```jsx
// section-05-essentials-practice-project-1/src/App.jsx:29
{!inputIsValid && <p className="error-text center">Please enter a valid duration</p>}
{inputIsValid && <Results userInput={userInput} />}
```

- `condition && <X />` — renders `<X />` when true, nothing when false.
- `condition ? <A /> : <B />` — one of two.
- Or prepare a variable with `if` before `return` (`Examples.jsx:15`, `Player.jsx:22`).

**Gotcha:** `0 && <X />` renders `0` on screen, because `0` is a valid React child. Use
`count > 0 && …`.

</details>

---

## Section 06 — Styling

### 20. How do styled-components work?

<details>
<summary>more-info</summary>

`styled.button` is a function called with a template literal. It returns a **new React component**
that renders a `<button>` with a generated, unique class name, and injects the CSS into a
`<style>` tag. Styles are scoped automatically — no clashes between components.

```jsx
// section-06-styled-components/src/components/Header.jsx:5
const HeaderStyle = styled.header`
  display: flex;
  & img { width: 11rem; }               /* & = this component */
  @media (min-width: 768px) { margin-bottom: 4rem; }
`;

<HeaderStyle>...</HeaderStyle>
```

</details>

### 21. What is a transient prop (`$invalid`) in styled-components and why the `$`?

<details>
<summary>more-info</summary>

```jsx
// section-06-styled-components/src/components/Input.jsx:3
const LabelStyle = styled.label`
  color: ${(props) => (props.$invalid ? "#f87171" : "#6b7280")};
`;

<LabelStyle $invalid={invalid}>{label}</LabelStyle>
```

**How:** an interpolated function receives the component's props, so CSS can change dynamically.

**Why `$`:** by default styled-components forwards props to the real DOM element. `invalid` would
end up as `<label invalid="true">` and React warns about an unknown attribute. Props starting with
`$` are *transient* — used for styling and never passed to the DOM.

</details>

### 22. How do you apply conditional styles with Tailwind CSS?

<details>
<summary>more-info</summary>

Tailwind is utility-first: you compose small classes (`px-4`, `text-red-500`) directly in
`className`. Conditional styles = build the class string in JavaScript:

```jsx
// section-06-tailwindcss/src/components/Input.jsx:2
let labelClasses = "block mb-2 text-xs font-bold tracking-wide uppercase";
if (invalid) {
  labelClasses += " text-red-500";
} else {
  labelClasses += " text-gray-500";
}
```

**Gotcha:** always write **full** class names. Tailwind scans source files for complete strings;
`"text-" + color + "-500"` is never found, so that CSS is never generated.

**Tailwind v4 note:** this project uses `@import "tailwindcss"` (v4). v4 configures the theme in
CSS (`@theme`) and does **not** load `tailwind.config.js` automatically — it needs
`@config "../tailwind.config.js";` in the CSS file. Without it, the custom `font-title` class from
`tailwind.config.js` has no effect.

</details>

---

## Section 07 — Debugging

### 23. What does `<StrictMode>` do and why does my code run twice?

<details>
<summary>more-info</summary>

**What:** a development-only wrapper that deliberately runs some code **twice** to expose bugs:

- component functions are rendered twice,
- `useState` / `useMemo` initializers and reducers are called twice,
- effects run **mount → cleanup → mount**.

**Why:** components must be *pure* (same input → same output, no side effects during render).
Running twice makes impure code visible — e.g. pushing into an array that lives outside the
component doubles every entry.

```jsx
// section-07-debugging/src/index.jsx
import { StrictMode } from "react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

In `section-07-debugging/src/components/Results.jsx:4` the `results` array is created **inside**
the component, so each (double) render starts from an empty array. Declared at module level, it
would collect duplicate rows on every render — exactly what StrictMode reveals.

Nothing is doubled in the production build.

</details>

### 24. Which tools help debug a React app?

<details>
<summary>more-info</summary>

1. **The error overlay / console** — read the message and the file:line it points to.
2. **Browser DevTools → Sources** — set breakpoints in your `.jsx` (Vite serves source maps)
   and step through the code.
3. **React DevTools** (browser extension) — *Components* tab shows the tree, props, state and
   Hooks of each component; *Profiler* shows what rendered and why.
4. **`<StrictMode>`** — surfaces impure code early (question [23](#23-what-does-strictmode-do-and-why-does-my-code-run-twice)).
5. `console.log` in the component body tells you **when** it renders (used heavily in section 12
   via `log.js`).

</details>

---

## Section 08 — Refs & Portals

### 25. Where do you keep a value like a timer id? Why not in a variable outside or inside the component?

<details>
<summary>more-info</summary>

```jsx
// section-08-refs-and-portals/src/components/TimerChallenge/TimerChallenge.jsx
// let timerId;   ❌ outside: shared by ALL TimerChallenge instances

export default function TimerChallenge({ title, targetTime }) {
  // let timerId; ❌ inside: re-created (undefined) on every render
  const timerIdRef = useRef();   // ✅ per instance, survives re-renders

  function handleStart() {
    timerIdRef.current = setInterval(...);
  }
  function handleStop() {
    clearInterval(timerIdRef.current);
  }
```

```text
module variable  → 1 box for all 4 timers   → starting timer #2 overwrites #1's id
local variable   → new empty box every render → after re-render the id is lost
useRef           → 1 box per component instance, kept by React across renders ✅
```

`App.jsx` renders four `<TimerChallenge>`s, so the module variable visibly breaks: stopping one
timer stops the wrong interval.

</details>

### 26. What is the difference between state and a ref?

<details>
<summary>more-info</summary>

- **State** — changing it **re-renders** the component. Use it for anything shown on screen.
- **Ref** — changing `ref.current` does **not** re-render. Use it for values the UI does not
  display (timer ids, the selected id in section 11) and for DOM access.

Both survive re-renders. A ref is basically `{ current: value }` that React keeps for you.

</details>

### 27. What is `useRef` and why do you always need `.current`?

<details>
<summary>more-info</summary>

`useRef(initial)` returns the same object `{ current: initial }` on every render. When you pass it
to JSX as `ref={myRef}`, React puts the **DOM element** into `myRef.current` after rendering.

```jsx
// section-08-refs-and-portals/src/components/Player.jsx
const playerRef = useRef(null);

function handleClick() {
  setPlayerName(playerRef.current.value);   // .current = the <input> DOM node
}

<input ref={playerRef} type="text" />
```

```text
playerRef           → 📦 { current: <input> }
playerRef.value     → undefined ❌
playerRef.current.value → "Zoran" ✅
```

Through `ref.current` you reach every DOM property and method: `.value`, `.focus()`,
`.showModal()`. This input is **uncontrolled** — React does not track each keystroke; you read the
value only when needed.

</details>

### 28. How does a parent call a function defined in a child? (`useImperativeHandle`)

<details>
<summary>more-info</summary>

`useImperativeHandle` decides **what the parent gets** in its ref. Instead of the raw `<dialog>`
DOM node, the child exposes a small custom API:

```jsx
// section-08-refs-and-portals/src/components/ResultModal/ResultModal.jsx
export default function ResultModal({ targetTime, remainingTime, onReset, ref }) {
  const dialogRef = useRef();

  useImperativeHandle(ref, () => ({
    open: () => {
      dialogRef.current.showModal();
    },
  }));
  ...
}

// TimerChallenge.jsx — the parent
const dialogRef = useRef();
<ResultModal ref={dialogRef} ... />
dialogRef.current.open();
```

**Why:** encapsulation. The parent only knows `open()`. If the modal later stops using `<dialog>`,
only `ResultModal` changes; `TimerChallenge` stays the same.

</details>

### 29. `forwardRef` vs `ref` as a prop — what changed in React 19?

<details>
<summary>more-info</summary>

- **React 18:** `ref` was not a normal prop. A function component had to be wrapped in
  `forwardRef((props, ref) => …)` to receive it.
- **React 19:** `ref` is a **regular prop** for function components. `forwardRef` still works but
  is no longer needed and will be deprecated.

Both styles are in this repo:

```jsx
// React 19 style — section-08-refs-and-portals/src/components/ResultModal/ResultModal.jsx:4
export default function ResultModal({ targetTime, remainingTime, onReset, ref }) { ... }

// Older style — section-10-context-api-reducer/src/components/CartModal.jsx:5
const CartModal = forwardRef(function Modal({ title, actions }, ref) { ... });
```

</details>

### 30. What is a Portal (`createPortal`) and why use it for modals?

<details>
<summary>more-info</summary>

`createPortal(jsx, domNode)` renders JSX into **another place in the DOM**, while in the React
tree it stays where you wrote it (props, context and events still work normally).

```jsx
// section-08-refs-and-portals/src/components/ResultModal/ResultModal.jsx:26
return createPortal(
  <dialog ref={dialogRef} onClose={onReset} className="result-modal">...</dialog>,
  document.getElementById("modal"),   // <div id="modal"> in index.html
);
```

**Why:** a modal written inside a deeply nested component would inherit its parent's
`overflow: hidden`, `z-index` and stacking context. Rendering it next to `#root` keeps styling
and accessibility (screen readers) predictable.

</details>

### 31. How does the built-in `<dialog>` element work with React?

<details>
<summary>more-info</summary>

- `dialogRef.current.showModal()` — opens it as a modal with a backdrop (needs a ref, it is a DOM
  method).
- `<form method="dialog">` — any submit button inside closes the dialog without JavaScript.
- `onClose` — fires whenever the dialog closes, **including the ESC key**. That is why
  `ResultModal` resets the timer in `onClose={onReset}`: otherwise ESC would close the dialog but
  leave the timer state stale.

</details>

---

## Section 10 — Context API & useReducer

### 32. What is prop drilling and how does the Context API solve it?

<details>
<summary>more-info</summary>

**Prop drilling:** passing data through components that don't use it, only so that a deeply
nested child can get it (`App → Shop → Product → button`).

**Context** lets any component below a Provider read a value directly, skipping the middle layers.

Three steps:

```jsx
// 1. create — section-10-context-api-reducer/src/store/shopping-cart-context.jsx:6
export const CartContext = createContext({
  items: [],
  addItemToCart: () => {},
  updateItemQuantity: () => {},
});

// 2. provide — same file, :104
<CartContext.Provider value={ctxValue}>{children}</CartContext.Provider>

// 3. consume — Product.jsx:5
const { addItemToCart } = useContext(CartContext);
```

**Why the default value lists functions:** it is used only when there is no Provider above, but
it also documents the shape and gives IDE autocomplete for `addItemToCart` etc.

**React 19:** you can render the context itself as the provider: `<CartContext value={ctxValue}>`.
`.Provider` still works.

</details>

### 33. Why put the Provider in its own component (`CartContextProvider`)?

<details>
<summary>more-info</summary>

```jsx
// section-10-context-api-reducer/src/App.jsx
<CartContextProvider>
  <Header />
  <Shop>...</Shop>
</CartContextProvider>
```

`App` no longer contains cart logic — state, reducer and handlers all live in
`store/shopping-cart-context.jsx`. `App` only *composes* the page.

**Performance bonus:** when the cart state changes, `CartContextProvider` re-renders, but
`<Header />` and `<Shop>` were created by `App` and passed in as `children` — React reuses those
same elements. Only components that call `useContext(CartContext)` re-render.

</details>

### 34. What is `useReducer` and when do you prefer it over `useState`?

<details>
<summary>more-info</summary>

**What:** state managed by a **reducer** — a pure function `(state, action) => newState`.
Components don't say *how* to change state, only *what happened*, by dispatching an action.

```jsx
// section-10-context-api-reducer/src/CounterApp.jsx
export function counterReducer(state, action) {
  if (action.type === "INCREMENT") return { count: state.count + 1 };
  if (action.type === "DECREMENT") return { count: state.count - 1 };
  if (action.type === "RESET")     return { count: 0 };
  return state;
}

const [counterState, dispatchCounterAction] = useReducer(counterReducer, { count: 0 });

<button onClick={() => dispatchCounterAction({ type: "INCREMENT" })}>Increment</button>
```

```text
click → dispatch({type}) → React calls counterReducer(oldState, action) → newState → re-render
```

**Prefer it when:** state is an object with several fields, many different updates touch it, or
the next state depends on the previous one in non-trivial ways (the shopping cart). All update
logic lives in one testable function.

**Destructuring variant** (also in `CounterApp.jsx:16`):

```js
export function counterReducer({ count }, { type }) {
  if (type === "INCREMENT") return { count: count + 1 };
  ...
  return { count };   // no "state" variable any more, so return a new box
}
```

</details>

### 35. Why is the reducer defined outside the component?

<details>
<summary>more-info</summary>

```js
// section-10-context-api-reducer/src/store/shopping-cart-context.jsx:12
// Reducer goes outside the React component
function shoppingCartReducer(state, action) { ... }
```

- It needs nothing from the component scope — everything comes in through `state` and `action`.
- It is not re-created on every render.
- It must be **pure**: no `fetch`, no `localStorage`, no mutation. StrictMode calls reducers twice
  to check this.
- It can be tested alone: `shoppingCartReducer({ items: [] }, { type: "ADD_ITEM", payload: { id: "p1" } })`.

</details>

### 36. How does the shopping-cart reducer update an item immutably?

<details>
<summary>more-info</summary>

```js
// section-10-context-api-reducer/src/store/shopping-cart-context.jsx:46
if (action.type === "UPDATE_ITEM") {
  const updatedItems = [...state.items];                       // 1. copy the array
  const updatedItemIndex = updatedItems.findIndex(
    (item) => item.id === action.payload.productId,
  );
  const updatedItem = { ...updatedItems[updatedItemIndex] };   // 2. copy the item

  updatedItem.quantity += action.payload.amount;               // 3. change the COPY

  if (updatedItem.quantity <= 0) {
    updatedItems.splice(updatedItemIndex, 1);                  // remove from the copy
  } else {
    updatedItems[updatedItemIndex] = updatedItem;
  }

  return { ...state, items: updatedItems };                    // 4. new state object
}
```

Every level that changes is copied (state → items array → item), so the old state is untouched
and React sees new references.

**Action shape:** `{ type, payload }` — `type` says what happened, `payload` carries the data.

</details>

### 37. What does a context value contain — data, functions, or both?

<details>
<summary>more-info</summary>

Both. The provider exposes the data **and** the functions that change it:

```jsx
// section-10-context-api-reducer/src/store/shopping-cart-context.jsx:98
const ctxValue = {
  items: shoppingCartState.items,
  addItemToCart: handleAddItemToCart,
  updateItemQuantity: handleUpdateItemQuantity,
};
```

`Cart.jsx` reads `items` and calls `updateItemQuantity`; `Product.jsx` only calls
`addItemToCart`; `Header.jsx` only reads `items.length`.

**Trade-off:** `ctxValue` is a new object on every provider render, so **every** consumer
re-renders whenever anything in the cart changes — even `Product`, which only needs a function
that never changes. See question [48](#48-how-can-two-contexts-one-for-the-value-one-for-the-setter-avoid-re-renders) for the fix.

</details>

### 38. What is the `use` API in React 19, and why is it allowed inside `if`?

<details>
<summary>more-info</summary>

`use(resource)` reads a **Context** or a **Promise**:

```jsx
import { use } from "react";

function Product({ id, showButton }) {
  if (showButton) {
    const { addItemToCart } = use(CartContext);   // ✅ allowed inside if
    ...
  }
}

const data = use(dataPromise);   // suspends until the promise resolves (needs <Suspense>)
```

**Why it can be conditional:** normal Hooks store data *by call order*, so skipping one shifts
the rest. `use` stores nothing in that slot list — it just reads the current context value or the
promise's result — so it may be called in `if` and loops.

**Limits:** it must still be called inside a component or a Hook (not in an event handler or a
plain helper), and not inside `try/catch`.

</details>

---

## Section 11 — useEffect & side effects

### 39. What is a side effect and when do you need `useEffect`?

<details>
<summary>more-info</summary>

**Side effect:** anything a component does besides returning JSX — timers, `fetch`, geolocation,
`localStorage`, manual DOM calls.

**Need `useEffect`:** when the effect must run **because the component rendered** and nothing in
the render itself can trigger it. Example: getting the user's location when `App` first appears:

```jsx
// section-11-useEffect/src/App.jsx:26
useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setAvailablePlaces(sortPlacesByDistance(AVAILABLE_PLACES, position.coords.latitude, position.coords.longitude));
    },
    () => {
      // Location unavailable: show places unsorted instead of "loading..." forever
      setAvailablePlaces(AVAILABLE_PLACES);
    },
  );
}, []);
```

Calling `setAvailablePlaces` directly in the component body would cause render → setState →
render → … an **infinite loop**. In an effect it runs once after the first render:

```text
render (empty list, "loading...") → screen painted → effect → setState → render (sorted list)
```

**Don't need `useEffect`:**

- In an **event handler** — the click already tells you when to run it:

  ```jsx
  // App.jsx:64 — this is a side effect, but NOT useEffect
  // (and Hooks can't be called inside a function anyway)
  localStorage.setItem("selectedPlaces", JSON.stringify([id, ...storedIds]));
  ```

- **Synchronous** code that only needs to run once — put it at module level:

  ```jsx
  // App.jsx:10 — runs once when the file loads, before App() is ever called
  const storedIds = JSON.parse(localStorage.getItem("selectedPlaces")) || [];
  ```

</details>

### 40. How does `useEffect` decide when to run? What do the dependency arrays mean?

<details>
<summary>more-info</summary>

**What React does:** it does **not** run your effect function during render. It stores it, paints
the screen first, then runs it. On the next render it compares the old and new dependency arrays
value by value (`Object.is`) and runs the effect again only if something changed.

**Analogy — an alarm that checks a list:** after every paint React looks at the list (the
dependency array). If anything on it is different from last time, the alarm rings and the effect
runs.

```text
useEffect(fn)              → no array
   runs: after EVERY render

useEffect(fn, [])          → empty list, nothing can change
   runs: only ONCE, after the first render (mount)

useEffect(fn, [onConfirm]) → list with values
   runs: after the first render + every time onConfirm changes
```

**Rule:** an effect always runs after the first paint; after that, only when something in the
array changed.

**In short:** `[]` → once, when the component appears · `[x]` → on appear and on every change of
`x` · no array → after every render.

</details>

### 41. When does the `useEffect` cleanup function run?

<details>
<summary>more-info</summary>

The function you `return` from an effect is the cleanup. It runs in exactly two cases:

1. **Before unmount** — the component is removed from the screen.
2. **Before the same effect runs again**, because a dependency changed.

It does **not** run before other functions or before other effects.

```jsx
// section-11-useEffect/src/components/DeleteConfirmation.jsx:7
useEffect(() => {
  const timer = setTimeout(() => {
    onConfirm();
  }, TIMER);

  return () => {
    clearTimeout(timer);
  };
}, [onConfirm]);
```

```text
Re-run:   render → screen painted → cleanup of the old effect → new effect
Unmount:  cleanup only
```

**In this app:**

- open the modal → `DeleteConfirmation` mounts → effect starts a 3 s timer;
- click **No** → the component disappears → cleanup clears the timer, so the place is **not**
  deleted;
- if `onConfirm` changed while the modal is open → cleanup clears the old timer, the effect starts
  a new one.

Without cleanup, clicking "No" would still delete the place 3 seconds later.

`progressBar.jsx` does the same with `setInterval` / `clearInterval`.

**Dev-only confusion:** in `<StrictMode>` React runs mount → cleanup → mount, so the console shows
"Set timer / Clearing up timer / Set timer". That is not a bug and does not happen in production.

</details>

### 42. Why does a function in the dependency array need `useCallback`?

<details>
<summary>more-info</summary>

Every time `App()` runs, `function handleRemovePlace() {}` creates a **new function object**.
Two functions with identical code are still different objects (`fnA !== fnB`), so
`[onConfirm]` looks "changed" on every `App` render → the effect re-runs every time. If the
effect itself causes the parent to re-render, you get an **infinite loop**; at minimum the 3 s
timer restarts on every parent render.

**Fix:** `useCallback` returns the **same** function object between renders until its own
dependencies change. It is applied to the **original** function — `handleRemovePlace` in `App`,
because `onConfirm={handleRemovePlace}`:

```jsx
// section-11-useEffect/src/App.jsx:76
const handleRemovePlace = useCallback(function handleRemovePlace() {
  setPickedPlaces((prev) => prev.filter((place) => place.id !== selectedPlace.current));
  setModalIsOpen(false);
  ...
}, []);   // uses only setters and a ref — both stable, so [] is correct
```

```text
without useCallback: render 1 → fn#1, render 2 → fn#2  → [onConfirm] changed → effect re-runs
with useCallback:    render 1 → fn#1, render 2 → fn#1  → nothing changed    → effect stays
```

</details>

### 43. How can `useEffect` keep a DOM API in sync with a prop? (Modal `open`)

<details>
<summary>more-info</summary>

```jsx
// section-11-useEffect/src/components/Modal.jsx:11
useEffect(() => {
  open && dialog.current.showModal();
  !open && dialog.current.close();
}, [open]);
```

**Why an effect is needed:** `showModal()` needs the DOM node in `dialog.current`, which only
exists **after** the first render. Calling it during render would crash on `undefined`.

**Two ways to control a modal:**

- **Declarative (here):** the parent sets state `modalIsOpen` and passes `open={modalIsOpen}`.
  The effect syncs the `<dialog>` with the prop. The parent never touches the DOM.
- **Imperative (section 08):** `useImperativeHandle` exposes `open()` and the parent calls
  `ref.current.open()`.

The declarative version keeps "is the modal open?" in React state, so the UI can't drift from it.
The imperative version is handy when the parent should only *trigger* the modal without owning
state for it.

</details>

---

## Section 12 — Optimization & how React renders

### 44. When does a component re-render, and in what order?

<details>
<summary>more-info</summary>

A component re-renders when:

1. its own state changes,
2. its **parent** re-renders (props changed or not!),
3. a context it consumes changes.

```jsx
// section-12-optimization/src/App.jsx:26
// components render in order, top to bottom; this also happens when App() re-renders
// so we should avoid that and create encapsulation so only what must re-render does
```

When `App`'s `chosenCount` changes, `App()` runs again, and so do `Header`, `SetCounter`,
`Counter`, … top to bottom — even though `Header` has no props. React then compares the result
with the real DOM and updates only what differs, but the function calls still cost time.

Open the console: `log.js` prints each render with indentation showing the tree depth.

</details>

### 45. Why is component composition the most important optimization?

<details>
<summary>more-info</summary>

**Move state down to the component that uses it.** Originally the number input state lived in
`App`, so every keystroke re-rendered the whole app:

```jsx
// section-12-optimization/src/App.jsx:10 — the old version
// // const runs on every render
// // when state changes, the whole App() function is re-rendered
// const [enteredNumber, setEnteredNumber] = useState(0);
```

It was moved into its own component:

```jsx
// section-12-optimization/src/components/SetCounter/SetCounter.jsx
const [enteredNumber, setEnteredNumber] = useState(0);   // typing re-renders only SetCounter
...
function handleSetClick() {
  onSet(enteredNumber);   // App learns the value only on click
}
```

**Rule:** every component should be agnostic of the others and own only the state it needs. This
costs nothing at runtime, unlike `memo`, which adds a props comparison on every render. Try
composition first.

</details>

### 46. What does `memo` do, and why is it used together with `useCallback`?

<details>
<summary>more-info</summary>

**`memo(Component)`:** before re-rendering, React compares the new props with the old ones
(shallow, `Object.is` per prop). All equal → skip this component **and its whole subtree**.

```jsx
// section-12-optimization/src/components/Counter/Counter.jsx:26
const Counter = memo(function Counter({ initialCount }) { ... });
```

When `App` re-renders and `initialCount` is still `0`, `Counter` is skipped.

**Why `useCallback` is needed with it:** a function prop is a new object on every render, so
`memo` would always see "changed":

```jsx
// Counter.jsx:37
const handleDecrement = useCallback(function handleDecrement() {
  setCounter((prevCounter) => prevCounter - 1);
}, []);

<IconButton icon={MinusIcon} onClick={handleDecrement}>Decrement</IconButton>
// IconButton is memo(...) — with a stable onClick it skips re-rendering
```

```text
memo alone:          onClick fn#1 → fn#2 → "props changed" → re-render anyway ❌
memo + useCallback:  onClick fn#1 → fn#1 → "props equal"   → skipped ✅
```

**Don't wrap everything:** the comparison itself costs time. Use `memo` high in the tree, on
components whose props rarely change.

</details>

### 47. What does `useMemo` do, and what happens with `[]` vs no dependency array?

<details>
<summary>more-info</summary>

**What:** caches the **result** of a calculation and recomputes it only when a dependency changes.
(`memo` = skip a component; `useCallback` = keep a function; `useMemo` = keep a computed value.)

```jsx
// section-12-optimization/src/components/Counter/Counter.jsx:30
const initialCountIsPrime = useMemo(
  () => isPrime(initialCount),
  [initialCount],
);
```

Clicking + / − changes `counter` and re-renders `Counter`, but `initialCount` stays the same, so
`isPrime` does **not** run again (watch the "Calculating if is prime number" log).

**Dependencies:**

```text
useMemo(fn, [initialCount]) → runs on first render + when initialCount changes
useMemo(fn, [])             → runs ONCE, never again
useMemo(fn)                 → runs on EVERY render (no caching at all)
```

> Correction to my old note "it will never execute if we do not provide dependency": with `[]` it
> runs once; *omitting* the array recomputes every render.

Use it only for expensive calculations — caching a cheap expression costs more than it saves.

</details>

### 48. How can two contexts (one for the value, one for the setter) avoid re-renders?

<details>
<summary>more-info</summary>

Instead of passing `setCounter` down through props (and stabilizing it with `memo` +
`useCallback`), the buttons can read it from Context. The trick is **two contexts**:

```jsx
const CounterValueContext  = createContext(0);
const CounterSetterContext = createContext(() => {});

function CounterProvider({ children }) {
  const [counter, setCounter] = useState(0);
  return (
    <CounterSetterContext value={setCounter}>        {/* setCounter never changes */}
      <CounterValueContext value={counter}>{children}</CounterValueContext>
    </CounterSetterContext>
  );
}

// buttons:  const setCounter = useContext(CounterSetterContext);  → never re-render
// output:   const counter    = useContext(CounterValueContext);   → re-renders on change
```

**Why:** a component re-renders when the context *it reads* changes. Buttons only read the setter,
which React guarantees is stable — so a counter change re-renders only the output. With one
context `{ counter, setCounter }`, every consumer would re-render (the problem from question
[37](#37-what-does-a-context-value-contain--data-functions-or-both)).

</details>

### 49. Why does `console.log` right after `setState` show the old value?

<details>
<summary>more-info</summary>

```jsx
// section-12-optimization/src/App.jsx:21
function handleSetCount(newCount) {
  setChosenCount((prevChosenCount) => prevChosenCount + 1);
  console.log(chosenCount); // won't work — prints the OLD value
}
```

**Scheduling:** `setChosenCount` does not change the value immediately. `chosenCount` is a plain
`const` inside one call of `App()`. Calling the setter only writes a note "change chosenCount" and
puts it in a queue. The current function call finishes with the old value. After your handler,
React reads all the notes, calls `App()` again, and only then `useState` returns the new value.

**Batching:** all updates from the same event are processed together, in **one** render.

**Analogy — waiter and kitchen:** the waiter (your handler) writes orders on notes. The kitchen
(React) does not cook after every note, but once the waiter finishes the whole table, all at once.

</details>

### 50. Where does React store state, and what does `key` have to do with it?

<details>
<summary>more-info</summary>

React does **not** keep state inside the `Counter()` function. It keeps it in a **drawer** attached
to the component's place in the tree. The drawer is identified by three things: **component
type, position, and `key`**.

- **First render (mount):** no drawer yet. React creates one and puts `initialCount` in it.
- **Every later render:** the drawer exists, so React returns what is in it and **completely
  ignores** the `initialCount` argument.

That is why changing the `initialCount` prop alone does not reset the counter.

**`key` is React's identity label.** When the label changes, React treats it as a different
component: it throws away the old one together with its state and builds a new one from scratch.

```jsx
// section-12-optimization/src/App.jsx:43 — using key={chosenCount} forces a reset
<CounterWithHistory key={chosenCount} initialCount={chosenCount} />
```

```text
key=0 → drawer#0 { counterChanges: [0, +1, +1] }
set 5 → key=5 → drawer#0 thrown away, drawer#5 { counterChanges: [5] } ✅
```

The commented-out `useEffect` in `CounterWithHistory.jsx:40` is the worse alternative: it renders
once with stale state, then resets it in an effect and renders again. `key` does it in one step.

</details>

### 51. Why must list keys be unique and stable?

<details>
<summary>more-info</summary>

```jsx
// section-12-optimization/src/components/Counter/CounterHistory.jsx:24
// React tracks state by position, so every list element needs a unique id
{history.map((count) => (
  <HistoryItem key={count.id} count={count.value} />
))}
```

Each `HistoryItem` has its own `selected` state. New changes are **prepended** to the list:

```text
key = index:  [A(selected), B] → prepend C → [C, A, B]
              C gets index 0 → inherits A's drawer → C looks selected ❌
key = id:     C gets a new drawer, A keeps its own → selection stays on A ✅
```

Indexes are fine only for lists that never reorder, insert or delete. `Math.random()` as an id is
fine **when created once** with the data (as here); generating it inside `.map()` would give a new
key every render and remount every item.

</details>

### 52. What is Million.js and what does `// million-ignore` mean?

<details>
<summary>more-info</summary>

Million.js is a compiler plugin that replaces React's virtual-DOM diffing for suitable components
with a faster "block" renderer that updates only the dynamic parts.

```js
// section-12-optimization/vite.config.js
plugins: [million.vite({ auto: true }), react()],
```

`auto: true` lets it pick components automatically. `// million-ignore` above a component opts it
out — used on the SVG icons (`UI/Icons/*.jsx`), which are passed as components to `IconButton` and
must stay normal React components.

It is an optional extra; the core techniques (composition, `memo`, `useCallback`, `useMemo`, keys)
are what interviews ask about.

</details>
