import { useState } from "react";
import { log } from "../../log.js";

export default function setCounter({ onSet }) {
  log("<setCounter /> rendered', 1");
  // const runs on every render
  // when state changes, the whole App() function is re-rendered
  const [enteredNumber, setEnteredNumber] = useState(0);

  // Functions are just created
  function handleChange(event) {
    setEnteredNumber(+event.target.value);
  }

  function handleSetClick() {
    onSet(enteredNumber);
    setEnteredNumber(0);
  }

  return (
    <section id="configure-counter">
      <h2>Set Counter</h2>
      <input type="number" onChange={handleChange} value={enteredNumber} />
      <button onClick={handleSetClick}>Set</button>
    </section>
  );
}
