"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var socket_io_1 = require("socket.io");
var rooms = {};
var initializeSocketServer = function (server) {
    var io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", function (socket) {
        console.log("New client connected:", socket.id);
        socket.on("createRoom", function (_a) {
            var username = _a.username;
            var roomId = Math.random().toString(36).substring(2, 8);
            rooms[roomId] = { players: [{ id: socket.id, username: username }], gameState: { grid: Array(9).fill(null), currentTurn: 0 } };
            socket.join(roomId);
            socket.emit("roomCreated", { roomId: roomId });
        });
        socket.on("joinRoom", function (_a) {
            var roomId = _a.roomId, username = _a.username;
            var room = rooms[roomId];
            if (room && room.players.length < 2) {
                room.players.push({ id: socket.id, username: username });
                socket.join(roomId);
                io.to(roomId).emit("roomJoined", { players: room.players });
            }
            else {
                socket.emit("roomFull");
            }
        });
        socket.on("makeMove", function (_a) {
            var roomId = _a.roomId, cellIndex = _a.cellIndex;
            var room = rooms[roomId];
            if (!room)
                return;
            var gameState = room.gameState;
            if (!gameState.grid[cellIndex] && room.players[gameState.currentTurn].id === socket.id) {
                gameState.grid[cellIndex] = gameState.currentTurn === 0 ? "X" : "O";
                gameState.currentTurn = 1 - gameState.currentTurn; // Toggle turn
                io.to(roomId).emit("updateGame", gameState);
            }
        });
        socket.on("disconnect", function () {
            console.log("Client disconnected:", socket.id);
        });
    });
};
exports.default = initializeSocketServer;
