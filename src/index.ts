import { Server } from "socket.io";
import express from "express";
import http from "http";
import axios from "axios";
import "dotenv/config"
import { group } from "console";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [process.env.FE_ORIGIN_URL!, process.env.BE_ORIGIN_URL!],
        methods: ["GET", "POST"],
        credentials: true,
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

io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    socket.on("register", (userId: string) => {
        socket.join(userId);
        console.log(`User ${userId} joined `);
    });

    socket.on("private-message", async (data) => {
        const { sender, recipient, content, fileUrl, type } = data;
        try {
            const response = await axios.post(`${process.env.API_BE_KEY}/social/send-private-message`, {
                senderId: sender,
                receiverId: recipient,
                content,
                fileUrl,
                type,
            });

            const savedMessage = response.data;

            io.to(sender).emit("receive-message", savedMessage);
            io.to(recipient).emit("receive-message", savedMessage);
        } catch (err) {
            console.error("Lỗi khi gửi API:", err);
        }
    })

    socket.on("group-message", async (data) => {
        const { sender, channelId, content, fileUrl, type, listMember } = data;
        try {
            const response = await axios.post(`${process.env.API_BE_KEY}/social/send-group-message`, {
                senderId: sender,
                groupId: channelId,
                content,
                fileUrl,
                type,
            });

            const savedMessage = response.data;

            io.to(sender).emit("receive-group-message", savedMessage);
            for (const element of listMember) {
                io.to(element._id).emit("receive-group-message", savedMessage);
            }
            // io.to(channelId).emit("receive-group-message", savedMessage);
        } catch (err) {
            console.error("Lỗi khi gửi API:", err);
        }
    })
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});

server.listen(3000, () => {
    console.log("WebSocket server listening on port 3000");
});
