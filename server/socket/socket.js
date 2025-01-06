import { Server } from "socket.io";
import { configDotenv } from "dotenv";

const rooms = {}; // Store rooms with their states

const initializeSocketServer = (server) => {

  configDotenv();

  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["my-custom-header"]
    },
    transports: ['websocket', 'polling']
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Create a new room
    socket.on("createRoom", ({ username }) => {
      let roomId;
      do {
        roomId = Math.random().toString(36).substring(2, 8); // Generate a random 6-character ID
      } while (rooms[roomId]); // Ensure roomId is unique

      rooms[roomId] = {
        players: [{ id: socket.id, username }],
        gameState: { grid: Array(9).fill(null), currentTurn: 0 },
      };

      console.log(`Room created: ${roomId}, Host: ${username}`);

      socket.join(roomId);
      socket.emit("roomCreated", { roomId });
    });

    // Join an existing room
    socket.on("joinRoom", ({ roomId, username }) => {
      const room = rooms[roomId];
      if (!room) {
        console.log(`Join attempt failed: Room ${roomId} does not exist.`);
        return socket.emit("roomNotFound");
      }

      if (room.players.length >= 2) {
        console.log(`Join attempt failed: Room ${roomId} is full.`);
        return socket.emit("roomFull");
      }

      room.players.push({ id: socket.id, username });
      socket.join(roomId);
      console.log(`${username} joined Room ${roomId}`);
      io.to(roomId).emit("roomJoined", { players: room.players });
    });

    // Handle moves and game logic
    socket.on("makeMove", ({ roomId, cellIndex }) => {
      const room = rooms[roomId];
      if (!room) {
        console.log(`Invalid move: Room ${roomId} does not exist.`);
        return;
      }

      const { gameState, players } = room;

      // Validate the move
      if (
        gameState.grid[cellIndex] || // Cell is already occupied
        players[gameState.currentTurn].id !== socket.id // Not the player's turn
      ) {
        console.log(`Invalid move: Room ${roomId}, Cell ${cellIndex}`);
        return;
      }

      // Update the grid with the player's symbol
      gameState.grid[cellIndex] = gameState.currentTurn === 0 ? "X" : "O";
      console.log(`Room ${roomId} Grid:`, gameState.grid);

      // Check for a winner
      const winner = checkWinner(gameState.grid);
      if (winner) {
          const winningPlayer = players[gameState.currentTurn].username;
          console.log(`Room ${roomId}: Winner is ${winningPlayer}`);
          io.to(roomId).emit("gameOver", { winner: winningPlayer }); // Now correctly sending the current player's username
          delete rooms[roomId]; // Clean up the room
          return;
      }

      // Check for a draw
      if (gameState.grid.every((cell) => cell)) {
        console.log(`Room ${roomId}: Game ended in a draw.`);
        io.to(roomId).emit("gameOver", { winner: "Draw" });
        delete rooms[roomId]; // Clean up the room
        return;
      }

      // Switch turns
      gameState.currentTurn = 1 - gameState.currentTurn;
      io.to(roomId).emit("updateGame", gameState);
    });

    // Reset the game state
    socket.on("resetGame", ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) {
        console.log(`Reset attempt failed: Room ${roomId} does not exist.`);
        return;
      }

      // Reset the grid and turn
      room.gameState = {
        grid: Array(9).fill(null),
        currentTurn: 0,
      };

      console.log(`Room ${roomId}: Game reset.`);
      io.to(roomId).emit("updateGame", room.gameState);
    });

    // Handle client disconnection
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);

      // Remove the player from the room
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const playerIndex = room.players.findIndex((player) => player.id === socket.id);

        if (playerIndex !== -1) {
          const playerName = room.players[playerIndex].username;
          room.players.splice(playerIndex, 1);
          console.log(`Player ${playerName} removed from Room ${roomId}`);

          // If the room is empty, delete it
          if (room.players.length === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} deleted.`);
          } else {
            // Notify the remaining player
            io.to(roomId).emit("opponentLeft");
          }
          break;
        }
      }
    });

    // Exit room logic
    socket.on("exitRoom", ({ roomId }) => {
      console.log(`User ${socket.id} exited Room ${roomId}`);
      socket.leave(roomId);

      const room = rooms[roomId];
      if (room) {
        const playerIndex = room.players.findIndex((player) => player.id === socket.id);
        if (playerIndex !== -1) {
          room.players.splice(playerIndex, 1);

          if (room.players.length === 0) {
            delete rooms[roomId];
            console.log(`Room ${roomId} deleted.`);
          } else {
            io.to(roomId).emit("opponentLeft");
          }
        }
      }
    });
  });

  // Function to check the winner
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
    return null; // No winner
  };
};

export default initializeSocketServer;
