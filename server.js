import http from "http";
import { Server } from "socket.io";
import express from "express";
import { publisher, subscriber, redis } from "./redis.js";
import authRouter from "./src/modules/auth/auth.routes.js";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import { authenticate } from "./src/modules/auth/auth.middleware.js";

async function main() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 8000;
  dotenv.config();

  app.use(express.json());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use("/auth", authRouter);

  const CHECKBOX_COUNT = 5000;
  const CHECKBOX_STATE_KEY = "checkbox-state";
  const RATE_LIMIT_MS = 5000;
  const checkboxes = new Array(CHECKBOX_COUNT).fill(null);

  const io = new Server();
  io.attach(server);

  await subscriber.subscribe("server:checkbox:change");
  subscriber.on("message", (channel, message) => {
    if (channel === "server:checkbox:change") {
      const data = JSON.parse(message);
      checkboxes[data.index] = data.checked;
      io.emit("server:checkbox:change", data);
    }
  });

  io.on("connection", (socket) => {
    socket.emit("server:checkbox:status", checkboxes);

    socket.on("client:checkbox:change", async (data) => {
      const userRateLimitKey = `user:${socket.id}:lastOp`;
      const { index, checked } = data;

      if (index < 0 || index >= CHECKBOX_COUNT) {
        socket.emit("server:error", {
          message: "Invalid checkbox index",
        });
        return;
      }
      const rateLimitKey = `checkbox:${socket.id}:lastOpTime`;
      const lastOpTime = await redis.get(rateLimitKey);
      const now = Date.now();

      if (lastOpTime && parseInt(lastOpTime) + RATE_LIMIT_MS > now) {
        const remainingTime = Math.ceil(
          (parseInt(lastOpTime) + RATE_LIMIT_MS - now) / 1000,
        );
        socket.emit("server:error", {
          data,
          message: `Hold on! let it breathe. You can only change a checkbox every ${RATE_LIMIT_MS / 1000} seconds. Please wait ${remainingTime} more seconds.`,
        });
        return;
      }

      await redis.set(rateLimitKey, now.toString(), "EX", RATE_LIMIT_MS / 1000);
      checkboxes[index] = checked;
      await redis.set(CHECKBOX_STATE_KEY, JSON.stringify(checkboxes));

      const broadcastData = { index, checked, timestamp: now };
      await publisher.publish(
        "server:checkbox:change",
        JSON.stringify(broadcastData),
      );
      io.emit("server:checkbox:change", broadcastData);
    });
  });

  app.use(express.static("./public"));
  app.get("/health", (req, res) => {
    res.json({
      health: true,
    });
  });
  app.get("/", (req, res) => { res.sendFile("index.html", { root: "./public" }) });

  app.get("/login", (req, res) => {
    res.sendFile("Login.html", { root: "./public" });
  });

  app.get("/signup", (req, res) => {
    res.sendFile("Signup.html", { root: "./public" });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

}

main().catch(console.error);
