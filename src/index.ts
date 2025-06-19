import { Server } from "socket.io";
import express from "express";
import http from "http";
import axios from "axios";
import "dotenv/config"
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
        const senderId = typeof sender === "string" ? sender : sender._id;
        const receiverId = typeof recipient === "string" ? recipient : recipient._id;
        console.log("private-message>>>>> pending");
        console.log("check data>>>", data);

        try {
            const response = await axios.post(`${process.env.API_SEND_MESSAGE}`, {
                senderId,
                receiverId,
                content,
                fileUrl,
                type,
            });

            const savedMessage = response.data;
            console.log("private-message>>>>> done");

            io.to(sender._id).emit("receive-message", savedMessage);
            io.to(receiverId).emit("receive-message", savedMessage);
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
