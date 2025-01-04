"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import socket from "../../utils/socket";
import "../../styles.css";

const GamePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get("roomId");
  //const username = searchParams.get("username");
  const [grid, setGrid] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);

  useEffect(() => {
    // Listen for game updates
    socket.on("updateGame", (gameState) => {
      setGrid(gameState.grid);
      setCurrentTurn(gameState.currentTurn);
    });

    socket.on("gameOver", ({ winner }) => {
      setWinner(winner);
    });

    socket.on("opponentLeft", () => {
      setOpponentLeft(true);
    });

    return () => {
      socket.off("updateGame");
      socket.off("gameOver");
      socket.off("opponentLeft");
    };
  }, []);

  const handleExit = () => {
    socket.emit("exitRoom", { roomId });
    router.push("/");
  };

  return (
    <div className="game-container">
      <h1 className="title">Room Code: {roomId}</h1>
      <div className="grid-container">
        {grid.map((cell, index) => (
          <div
            key={index}
            onClick={() => {
              if (!grid[index] && !winner && !opponentLeft) {
                socket.emit("makeMove", { roomId, cellIndex: index });
              }
            }}
            className={`cell ${cell ? "occupied" : ""}`}
          >
            {cell}
          </div>
        ))}
      </div>
      <p className="status">
        {winner
          ? winner === "Draw"
            ? "It's a Draw!"
            : `Winner: ${winner}`
          : opponentLeft
          ? "Opponent Left the Game!"
          : `Current Turn: ${currentTurn === 0 ? "Player 1 (X)" : "Player 2 (O)"}`}
      </p>
      {(winner || opponentLeft) && (
        <div className="overlay">
          <div className="popup">
            <h2>{winner ? `${winner} Wins!` : "Opponent Left the Game!"}</h2>
            <button className="exit-btn" onClick={handleExit}>
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
