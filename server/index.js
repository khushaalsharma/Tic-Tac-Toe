import express from "express";
import http from "http";
import initializeSocketServer from "./socket/socket.js";
import { configDotenv } from "dotenv";

// Create an Express application
const app = express();

configDotenv();

// Create an HTTP server using Express
const server = http.createServer(app);

// Initialize Socket.IO server
initializeSocketServer(server);

//handling CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_CLIENT_URL);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});


// Define a basic route for testing
app.get("/", (req, res) => {
  res.send("Welcome to the standalone Node.js server!");
});

// Define a port for the server
const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log("Socket Server is listening from: ", process.env.NEXT_PUBLIC_CLIENT_URL);
});
