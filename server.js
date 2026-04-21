import { WebSocket, WebSocketServer } from "ws";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, "index.html");
  if (req.url === "/script.js") {
    filePath = path.join(__dirname, "script.js");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("File not found");
      return;
    }
    if (req.url === "/script.js") {
      res.writeHead(200, { "Content-Type": "application/javascript" });
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
    }

    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

let activeUsers = 0;
let checkboxState = new Array(100).fill(false);

wss.on("connection", (ws) => {
  activeUsers++;
  broadcastStats();

  ws.send(JSON.stringify(checkboxState));
  ws.send(JSON.stringify({ activeUsers }));

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    const userId = ws._socket.remoteAddress;

    if (data.index !== undefined && data.checked !== undefined) {
      checkboxState[data.index] = data.checked;
      broadcastCheckboxState(data);
    }
  });

  ws.on("close", () => {
    activeUsers--;
    broadcastStats();
  });
});

function broadcastStats() {
  const stats = { activeUsers };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(stats));
    }
  });
}

function broadcastCheckboxState(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
