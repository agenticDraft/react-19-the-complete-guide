import { useState, useRef } from "react";
import ResultModal from "../ResultModal/ResultModal";

// will not work like this, because the variable will be outside component and will be shared between all instances of the component,
// so if you have multiple timers, they will share the same timerId
// let timerId;

export default function TimerChallenge({ title, targetTime, remainingTime }) {
  const timerIdRef = useRef();
  const dialogRef = useRef();

  const [timeRemaining, setTimeRemaining] = useState(targetTime * 1000); // multiply by 1000 to convert seconds to milliseconds
  const timerIsActive = timeRemaining > 0 && timeRemaining < targetTime * 1000;

  //let timerId;
  // not working with variable declared inside the component, because it will be reinitialized on every render
  // solution: declare it outside the component, so it will be initialized only once

  if (timeRemaining <= 0) {
    clearInterval(timerIdRef.current);
    dialogRef.current.open();
  }

  function handleReset() {
    setTimeRemaining(targetTime * 1000);
  }

  function handleStart() {
    timerIdRef.current = setInterval(() => {
      setTimeRemaining((prevTimeRemaining) => prevTimeRemaining - 10);
    }, 10);
  }

  function handleStop() {
    dialogRef.current.open();
    clearInterval(timerIdRef.current);
  }

  return (
    <>
      <ResultModal
        ref={dialogRef}
        result="lost"
        targetTime={targetTime}
        remainingTime={timeRemaining}
        onReset={handleReset}
      />
      <section className="challenge">
        <h2>{title}</h2>
        <p className="challenge-time">
          {targetTime} second{}
          {targetTime > 1 ? "s" : ""}
        </p>
        <p>
          <button onClick={timerIsActive ? handleStop : handleStart}>
            {timerIsActive ? "Stop" : "Start"}
          </button>
        </p>
        <p className={timerIsActive ? "active" : undefined}>
          {timerIsActive ? "Time is running..." : "Timer inactive"}
        </p>
      </section>
    </>
  );
}
