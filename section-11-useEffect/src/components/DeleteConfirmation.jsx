import { useEffect } from "react";
import ProgressBar from "./progressBar";

const TIMER = 3000;

export default function DeleteConfirmation({ onConfirm, onCancel }) {
  useEffect(() => {
    console.log("Set timer");
    const timer = setTimeout(() => {
      onConfirm();
    }, TIMER);

    //Cleanup se pokreće u dva slučaja:
    //pred unmount — tačno;
    //pred ponovno pokretanje istog tog effect-a,
    // kad se promeni nešto iz dependency niza.
    // Ne pokreće se pred „ostalim funkcijama“ ni pred drugim effect-ima.
    return () => {
      console.log("Clearing up timer");
      clearTimeout(timer);
    };
  }, [onConfirm]);
  // onConfirm is a function -

  return (
    <div id="delete-confirmation">
      <h2>Are you sure?</h2>
      <p>Do you really want to remove this place?</p>
      <div id="confirmation-actions">
        <button onClick={onCancel} className="button-text">
          No
        </button>
        <button onClick={onConfirm} className="button">
          Yes
        </button>
      </div>
      <ProgressBar timer={TIMER}/>
    </div>
  );
}
