import http from "http";
import fs from "fs";
import path from "path";
import { Server } from "socket.io";
import express from "express";

async function main() {
  const app = express();
  const rateLimitingHashMap = new Map();
  const server = http.createServer(app);
  const PORT = process.env.PORT || 8000;
  app.get("/health", (req, res) => {
    res.json({
      health: true,
    });
  });

  const CHECKBOX_COUNT = 5000;
  const checkboxes = new Array(CHECKBOX_COUNT).fill(null);

  const io = new Server();
  io.attach(server);

  io.on("connection", (socket) => {
    console.log("Socket connected", { id: socket.id });
    socket.emit("server:checkbox:status", checkboxes);

    socket.on("client:checkbox:change", (data) => {
      console.log(
        `Received checkbox change from client: ${socket.id}, Data:`,
        data,
      );
      let lastOpTime = rateLimitingHashMap.get(socket.id);
      if (lastOpTime) {

        if (lastOpTime + 5000 > Date.now()) {
          socket.emit("server:error", {
            data,
            message:
              "Hold on! let it breathe. You can only change a checkbox every 5 seconds.",
          });
          return;
        } else {
          rateLimitingHashMap.set(socket.id, Date.now());
        }
      } else {
        rateLimitingHashMap.set(socket.id, Date.now());
      }
      checkboxes[data.index] = data.checked;
      io.emit("server:checkbox:change", data);
    });
  });

  app.use(express.static(path.resolve("./public")));
  
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
