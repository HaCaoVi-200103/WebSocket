import { Server } from "socket.io";
import express from "express";
import http from "http";
import axios from "axios";
import "dotenv/config"
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(express.json());

app.post("/notify", (req, res) => {
    const { userId, action } = req.body;

    if (!userId || !action) {
        return res.sendStatus(200);
    }

    io.to(userId).emit("user-action", action);
    res.sendStatus(200);
});

app.post("/private-message", async (req, res) => {
    const { senderId, receiverId, content, fileUrl, type } = req.body;
    try {
        if (!senderId || !receiverId || !content || !fileUrl || !type) {
            return res.sendStatus(200);
        }
        const response = await axios.post(`${process.env.API_SEND_MESSAGE}`, {
            senderId,
            receiverId,
            content,
            fileUrl,
            type,
        });

        const savedMessage = response.data;

        io.to(receiverId).emit("receive-message", savedMessage);
        return res.sendStatus(200);
    } catch (err) {
        console.error("Lỗi khi gửi API:", err);
    }
});

io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    socket.on("register", (userId: string) => {
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
