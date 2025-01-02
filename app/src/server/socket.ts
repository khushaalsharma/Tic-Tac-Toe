import { Server } from "socket.io";
import http from "http";

interface Player {
  id: string;
  username: string;
}

interface GameState {
  grid: (string | null)[];
  currentTurn: number;
}

interface Room {
  players: Player[];
  gameState: GameState;
}

const rooms: Record<string, Room> = {};

const initializeSocketServer = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("createRoom", ({ username }) => {
      const roomId = Math.random().toString(36).substring(2, 8);
      rooms[roomId] = { players: [{ id: socket.id, username }], gameState: { grid: Array(9).fill(null), currentTurn: 0 } };
      socket.join(roomId);
      socket.emit("roomCreated", { roomId });
    });

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

    socket.on("makeMove", ({ roomId, cellIndex }) => {
      const room = rooms[roomId];
      if (!room) return;

      const { gameState } = room;
      if (!gameState.grid[cellIndex] && room.players[gameState.currentTurn].id === socket.id) {
        gameState.grid[cellIndex] = gameState.currentTurn === 0 ? "X" : "O";
        gameState.currentTurn = 1 - gameState.currentTurn; // Toggle turn
        io.to(roomId).emit("updateGame", gameState);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export default initializeSocketServer;
