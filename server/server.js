const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

let esp32 = null;

wss.on("connection", (ws) => {
    console.log("Connected");

    ws.on("message", (message) => {
        const msg = message.toString();

        console.log(msg);

        if (msg === "ESP32") {
            esp32 = ws;

            console.log("ESP32 registered");

            return;
        }

        if (esp32 && esp32.readyState === WebSoclet.OPEN) {
            esp32.send(msg);
        }
    });

    ws.on("close", () => {
        console.log("Disconnected");
        
        if (ws === esp32) {
            esp32 = null;
        }
    });
});

console.log("Running on 8080");