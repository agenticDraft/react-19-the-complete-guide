import React from "react";

export function counterReducer(state, action) {
  if (action.type === "INCREMENT") {
    return { count: state.count + 1 };
  } else if (action.type === "DECREMENT") {
    return { count: state.count - 1 };
  } else if (action.type === "RESET") {
    return { count: 0 };
  }

  return state;
}

// moze i ovako sa destructuring
// export function counterReducer({ count }, { type }) {
//   if (type === "INCREMENT") {
//     return { count: count + 1 };
//   } else if (type === "DECREMENT") {
//     return { count: count - 1 };
//   } else if (type === "RESET") {
//     return { count: 0 };
//   }

//   return { count }; // nema više promenljive "state", pa vraćamo novu kutiju
// }


function App() {
  const [counterState, dispatchCounterAction] = React.useReducer(
    counterReducer,
    { count: 0 },
  );

  return (
    <div id="app">
      <h1>The (Final?) Counter</h1>
      <p id="actions">
        <button onClick={() => dispatchCounterAction({ type: "INCREMENT" })}>
          Increment
        </button>
        <button onClick={() => dispatchCounterAction({ type: "DECREMENT" })}>
          Decrement
        </button>
        <button onClick={() => dispatchCounterAction({ type: "RESET" })}>
          Reset
        </button>
      </p>
      <p id="counter">{counterState.count}</p>
    </div>
  );
}

export default App;
