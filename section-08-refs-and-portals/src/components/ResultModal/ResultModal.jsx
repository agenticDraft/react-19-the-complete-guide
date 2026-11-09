import { useImperativeHandle, useRef } from "react";
import {createPortal} from "react-dom";

export default function ResultModal({
  targetTime,
  remainingTime,
  onReset,
  ref,
}) {
  const dialogRef = useRef();

  const userLost = remainingTime <= 0;
  const formattedRemainingTime = (remainingTime / 1000).toFixed(2);
  const score = Math.round((1 - remainingTime / (targetTime * 1000)) * 100);
  // useImperativeHandle is a React hook that allows you to customize the instance value that is exposed
  // when using ref
  // in a parent component. In this case, it is used to expose a method called showModal on the dialogRef,
  // which allows the parent component to control the visibility of the modal dialog.
  useImperativeHandle(ref, () => ({
    open: () => {
      dialogRef.current.showModal();
    },
  }));

  // onClose is a built-in event handler for the <dialog> element that is triggered when the ESC is pressed.
    return createPortal(
        <dialog ref={dialogRef} onClose={onReset} className="result-modal">
            {userLost && <h2>You lost</h2>}
            {!userLost && <h2>Your score: {score}</h2>}
            <p>
                The target time was <strong>{targetTime}</strong> seconds.
            </p>
            <p>
                You stopped the timer with{" "}
                <strong>{formattedRemainingTime} seconds</strong>
            </p>
            <form method="dialog" onSubmit={onReset}>
                <button>Close</button>
            </form>
        </dialog>,
        document.getElementById("modal")
  );
}
