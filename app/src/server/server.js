import next from "next";
import express from "express";
import http from "http";
import initializeSocketServer from "./socket.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

(async () => {
  await app.prepare();
  const expressApp = express();
  const server = http.createServer(expressApp);

  initializeSocketServer(server);

  expressApp.all("*", (req, res) => handle(req, res));
  console.log("Server initialized");
  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
