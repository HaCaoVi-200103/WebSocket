import { Server } from "socket.io";
import express from "express";
import http from "http";

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
        res.sendStatus(200);
    }

    io.to(userId).emit("user-action", action);
    res.sendStatus(200);
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
