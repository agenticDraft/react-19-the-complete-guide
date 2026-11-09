import { useState } from "react";

export default function Player({ initialName, symbol, isActive, onChangeName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [playerName, setPlayerName] = useState(initialName);

  function handleChange(e) {
    setPlayerName(e.target.value);
  }

  function handleEditClick() {
    //setIsEditing(!isEditing); // this is not the correct way to toggle state based on previous state, because React batches state updates and the value of isEditing may not be the latest value when this function is called.
    //setIsEditing(!isEditing);
    setIsEditing((editing) => !editing); // this is the correct way to toggle state based on previous state
    
    if (isEditing) {
      // to not execute on every user stroke
      onChangeName(symbol, playerName);
    }
  }

  let playerNameEl = <span className="player-name">{playerName}</span>;

  if (isEditing) {
    playerNameEl = (
      <input type="text" required value={playerName} onChange={handleChange} />
    );
  }

  return (
    <li className={isActive ? "active" : undefined}>
      <span className="player">
        {playerNameEl}
        <span className="player-symbol">{symbol}</span>
      </span>
      <button onClick={handleEditClick}>{isEditing ? "Save" : "Edit"}</button>
    </li>
  );
}
