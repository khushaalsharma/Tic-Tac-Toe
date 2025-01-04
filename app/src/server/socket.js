import { Server } from "socket.io";

const rooms = {};

const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Create a new room
    socket.on("createRoom", ({ username }) => {
      const roomId = Math.random().toString(36).substring(2, 8);
      rooms[roomId] = {
        players: [{ id: socket.id, username }],
        gameState: { grid: Array(9).fill(null), currentTurn: 0 },
      };
      socket.join(roomId);
      socket.emit("roomCreated", { roomId });
    });

    // Join an existing room
    socket.on("joinRoom", ({ roomId, username }) => {
      const room = rooms[roomId];
      if (room && room.players.length < 2) {
        room.players.push({ id: socket.id, username });
        socket.join(roomId);
        io.to(roomId).emit("roomJoined", { players: room.players });
      } else {
        socket.emit("roomFull");
      }
    });

    // Handle moves and check game logic
    socket.on("makeMove", ({ roomId, cellIndex }) => {
      console.log(`Move received: Room - ${roomId}, Cell - ${cellIndex}`);
      const room = rooms[roomId];
      if (!room) return;

      const { gameState } = room;
      if (!gameState.grid[cellIndex] && room.players[gameState.currentTurn].id === socket.id) {
        gameState.grid[cellIndex] = gameState.currentTurn === 0 ? "X" : "O";
        console.log(`Grid updated: ${gameState.grid}`);
        
        const winner = checkWinner(gameState.grid);
        if (winner) {
          io.to(roomId).emit("gameOver", { winner: room.players[gameState.currentTurn === 0 ? 1 : 0].username });
          delete rooms[roomId];
          return;
        }

        if (gameState.grid.every((cell) => cell)) {
          io.to(roomId).emit("gameOver", { winner: "Draw" });
          delete rooms[roomId];
          return;
        }

        gameState.currentTurn = 1 - gameState.currentTurn;
        io.to(roomId).emit("updateGame", gameState);
      } else {
        console.log("Invalid move or not the player's turn.");
      }
    });

    socket.on("resetGame", ({ roomId }) => {
      console.log(`Reset game request received for room: ${roomId}`);
      const room = rooms[roomId];
      if (!room) {
        console.log("Room not found");
        return;
      }

      // Reset game state
      room.gameState = {
        grid: Array(9).fill(null),
        currentTurn: 0,
      };

      console.log("Game state reset for room:", roomId);

      // Notify clients of the reset
      io.to(roomId).emit("updateGame", room.gameState);
    });

    socket.on("updateGame", (gameState) => {
      console.log("Game state updated:", gameState);
      setGrid(gameState.grid);
      setCurrentTurn(gameState.currentTurn);
      setWinner(null); // Clear the winner state
    });


    // Handle client disconnection
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      // Remove the player from the room
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);

          // If the room is empty, delete it
          if (room.players.length === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} deleted`);
          } else {
            // Notify the other player that the opponent has left
            io.to(roomId).emit("opponentLeft");
          }
          break;
        }
      }
    });

    socket.on("exitRoom", ({ roomId }) => {
      console.log(`User ${socket.id} exited room ${roomId}`);
      socket.leave(roomId);

      const room = rooms[roomId];
      if (room) {
        const playerIndex = room.players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);

          // If the room is empty, delete it
          if (room.players.length === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} deleted`);
          } else {
            // Notify the other player that the opponent has left
            io.to(roomId).emit("opponentLeft");
          }
        }
      }
    });

  });

  // Function to check if someone has won
  const checkWinner = (grid) => {
    const winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combo of winningCombos) {
      const [a, b, c] = combo;
      if (grid[a] && grid[a] === grid[b] && grid[a] === grid[c]) {
        return grid[a]; // Return "X" or "O"
      }
    }
    return null; // No winner yet
  };
};

export default initializeSocketServer;
