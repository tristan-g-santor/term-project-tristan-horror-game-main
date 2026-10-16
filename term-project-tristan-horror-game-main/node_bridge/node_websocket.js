// node_bridge/server.js
import net from "net";
import { WebSocketServer } from "ws";


//chagne this using LAN IP
const TCP_HOST = "192.168.11.101"; //use ipconfig
const TCP_PORT = 22599;

const WSS_PORT = 8080;

// create WebSocket server for Phaser
//these ports talk to browser and has nothing to with POSIX sockets
//this is so its able to communicate with the frontend and the API Calls
const wss = new WebSocketServer({ port: WSS_PORT });
console.log(`[WS] WebSocket server running on ws://localhost:${WSS_PORT}`);

wss.on("connection", (ws) => {
    console.log("[WS] Client connected");

    // create TCP connection to Python backend
    const tcpClient = new net.Socket();
    tcpClient.connect(TCP_PORT, TCP_HOST, () => {
        console.log("[TCP] Connected to Python backend");
    });


    ws.on("message", (msg) => {
        tcpClient.write(msg + "\n");
    });


    tcpClient.on("data", (data) => {
        ws.send(data.toString());
    });

    // handle disconnects
    ws.on("close", () => {
        tcpClient.end();
        console.log("[WS] Client disconnected");
    });

    tcpClient.on("close", () => {
        console.log("[TCP] Backend connection closed");
    });
});
