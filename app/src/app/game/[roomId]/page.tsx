"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import socket from "../../utils/socket";
import "../../styles.css";

const GamePage = () => {
  const router = useRouter();
  const {roomId} = useParams();
  //const username = searchParams.get("username");
  const [grid, setGrid] = useState(Array(9).fill(null));
  const [currentTurn, setCurrentTurn] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  const handleCopyRoomId = () => {
    if (typeof roomId === "string") {
      navigator.clipboard.writeText(roomId).then(
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
      },
      );
    } else {
      alert("Failed to copy room ID");
    }
  };

  return (
    <div className="game-container">
      {/* Room ID Display */}
      <div className="room-id-container">
        <span className="room-id-text">Room ID: {roomId}</span>
        <button className="copy-btn" onClick={handleCopyRoomId} suppressHydrationWarning={true}>
          Copy
        </button>
        {copySuccess && <span className="copy-success">Copied!</span>}
      </div>
      <div className="grid-container">
        {grid.map((cell, index) => (
          <div
            key={index}
            onClick={() => {
              if (!grid[index] && !winner && !opponentLeft) {
                socket.emit("makeMove", { roomId, cellIndex: index });
              }
            }}
            suppressHydrationWarning={true}
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
            <button className="exit-btn" onClick={handleExit} suppressHydrationWarning={true}>
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePage;
