export default function GameBoard({ onSelectSquare, board }) {
  // move the code in APP.jsx
  //   let gameBoard = initialGameBoard;

  //   for (const turn of turns) {
  //     //it turns are empty, for loop will not executed. Handled automatically
  //     let { square, player } = turn; // come from updatedTurns Object in App.jsx
  //     let { row, col } = square;
  //     gameBoard[row][col] = player;
  //   }

  //   const [gameBoard, setGameBoard] = useState(initialGameBoard);

  //   function handleSelectSquare(rowIndex, colIndex) {
  //     console.log("handleSelectSquare called");
  //     setGameBoard((prevGameBoard) => {
  //       const updatedGameBoard = [
  //         ...prevGameBoard.map((innerArray) => [...innerArray]),
  //       ]; // create a copy of the previous game board

  //       updatedGameBoard[rowIndex][colIndex] = activePlayerSymbol; // update the selected square with the active player's symbol

  //       return updatedGameBoard;
  //     });

  //     onSelectSquare(); // call the onSelectSquare function passed as a prop from the parent component
  //   }

  return (
    <ol id="game-board">
      {board.map((row, rowIndex) => (
        <li key={rowIndex} className="game-board-row">
          <ol>
            {row.map((playerSymbol, colIndex) => (
              <li key={colIndex} className="game-board-cell">
                <button
                  className="game-board-cell-button"
                  onClick={() => onSelectSquare(rowIndex, colIndex)}
                  disabled={playerSymbol !== null}
                >
                  {playerSymbol}
                </button>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
