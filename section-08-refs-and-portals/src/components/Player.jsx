import { useState, useRef } from "react";

export default function Player() {
  const playerRef = useRef(null);
  const [playerName, setPlayerName] = useState(null);

  function handleClick() {
    // Kad koristim Ref, uvek mora .current da se doda kada se koristi ref
    setPlayerName(playerRef.current.value);
  }

  return (
    <section id="player">
      <h2>Welcome {playerName ?? "unknown entity"}</h2>
      <p>
        <input ref={playerRef} type="text"/>
        <button onClick={handleClick}>Set Name</button>
      </p>
    </section>
  );
}
