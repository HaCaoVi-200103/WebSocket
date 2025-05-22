"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});
app.use(express_1.default.json());
app.post("/notify", (req, res) => {
    const { userId, action } = req.body;
    io.to(userId).emit("user-action", action);
    res.sendStatus(200);
});
io.on("connection", (socket) => {
    console.log("User connected", socket.id);
    socket.on("register", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined `);
    });
    socket.on("send-to-user", ({ userId, action }) => {
        io.to(userId).emit("user-action", action);
    });
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});
server.listen(3000, () => {
    console.log("WebSocket server listening on port 3000");
});
