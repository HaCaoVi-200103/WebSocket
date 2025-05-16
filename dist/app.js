"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const ws_1 = require("ws");
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Tạo WebSocket server
const wss = new ws_1.WebSocketServer({ server });
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        ws.send(`You said: ${message}`);
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
app.get('/', (_req, res) => {
    res.send('WebSocket server is running');
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
