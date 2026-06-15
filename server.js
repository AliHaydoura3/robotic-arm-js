const WebSocket = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

const server = http.createServer((req, res) => {
    if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(fs.readFileSync(path.join(__dirname, "frontend", "index.html")));
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

const wss = new WebSocket.Server({ server });

let esp32 = null;
let clients = new Set();

wss.on("connection", (ws) => {
    console.log("[INFO] Client connected");
    clients.add(ws);

    ws.on("message", (message) => {
        const msg = message.toString();
        console.log("[MESSAGE]", msg);

        if (msg === "ESP32") {
            esp32 = ws;
            console.log("[INFO] ESP32 registered");
            ws.send(JSON.stringify({ type: "ack", status: "registered" }));
            return;
        }

        // Parse motor command: {motorId: 1-6, angle: 0-180}
        try {
            const command = JSON.parse(msg);
            if (command.motorId && command.angle !== undefined) {
                // Forward to ESP32 if connected
                if (esp32 && esp32.readyState === WebSocket.OPEN) {
                    esp32.send(msg);
                    console.log(`[FORWARD] Motor ${command.motorId} -> angle ${command.angle}`);
                } else {
                    console.log("[WARN] ESP32 not connected, command dropped");
                }
            }
        } catch (e) {
            console.log("[ERROR] Invalid message format:", e.message);
        }
    });

    ws.on("close", () => {
        console.log("[INFO] Client disconnected");
        clients.delete(ws);
        if (ws === esp32) {
            esp32 = null;
            console.log("[INFO] ESP32 disconnected");
        }
    });

    ws.on("error", (error) => {
        console.log("[ERROR]", error.message);
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`[SERVER] Robotic Arm Controller running on http://localhost:${PORT}`);
});