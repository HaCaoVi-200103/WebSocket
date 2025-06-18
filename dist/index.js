"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const axios_1 = __importDefault(require("axios"));
require("dotenv/config");
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
    if (!userId || !action) {
        return res.sendStatus(200);
    }
    io.to(userId).emit("user-action", action);
    res.sendStatus(200);
});
app.post("/private-message", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { senderId, receiverId, content, fileUrl, type } = req.body;
    try {
        if (!senderId || !receiverId || !content || !fileUrl || !type) {
            return res.sendStatus(200);
        }
        const response = yield axios_1.default.post(`${process.env.API_SEND_MESSAGE}`, {
            senderId,
            receiverId,
            content,
            fileUrl,
            type,
        });
        const savedMessage = response.data;
        io.to(receiverId).emit("receive-message", savedMessage);
        return res.sendStatus(200);
    }
    catch (err) {
        console.error("Lỗi khi gửi API:", err);
    }
}));
io.on("connection", (socket) => {
    console.log("User connected", socket.id);
    socket.on("register", (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined `);
    });
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});
server.listen(3000, () => {
    console.log("WebSocket server listening on port 3000");
});
