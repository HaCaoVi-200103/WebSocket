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
        try {
            const response = await axios.post(`${process.env.BE_ORIGIN_URL}/social/send-private-message`, {
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

    socket.on("notify-new-friend", async (data) => {
        const { receiverId, userId } = data;
        try {
            const response = await axios.post(`${process.env.BE_ORIGIN_URL}/social/send-friend-request`, {
                receiverId, userId
            });

            const savedMessage = response.data;
            io.to(userId).emit("receive-notify-new-friend", savedMessage);
            io.to(receiverId).emit("receive-notify-new-friend", savedMessage);
        } catch (err) {
            console.error("Lỗi khi gửi API:", err);
        }
    })

    socket.on("group-message", async (data) => {
        const { sender, channelId, content, fileUrl, type, listMember } = data;
        try {
            const response = await axios.post(`${process.env.BE_ORIGIN_URL}/social/send-group-message`, {
                senderId: sender,
                groupId: channelId,
                content,
                fileUrl,
                type,
            });

            const savedMessage = response.data;

            for (const member of listMember) {
                const userId = member._id;

                const res: any = await axios.get(`${process.env.BE_ORIGIN_URL}/social/unread-count-message-group/${userId}?groupId=${channelId}`);
                console.log(res);

                const count = res.data.count ? res.data.count : 0;
                console.log("userID: ", userId, "::::: count: ", count);

                io.to(userId).emit("receive-group-message", {
                    ...savedMessage,
                    count
                });
            }

            // Gửi lại cho sender
            io.to(sender).emit("receive-group-message", {
                ...savedMessage,
                count: 0
            });
        } catch (err) {
            console.error("Lỗi khi gửi API:", err);
        }
    })

    socket.on("notify-status-friend-request", async (data) => {
        const { senderId, userId, status } = data;
        try {
            const response = await axios.patch(`${process.env.BE_ORIGIN_URL}/social/update-status-friend-request`, {
                senderId, userId, status
            });
            const savedMessage = response.data;

            io.to(userId).emit("receive-notify-status-friend-request", savedMessage);
            io.to(senderId).emit("receive-notify-status-friend-request", savedMessage);
        } catch (err) {
            console.error("Lỗi khi gửi API:", err);
        }
    })

    socket.on("notification-join-group", async (res) => {
        const { listMember, channelName, channelId, data } = res;
        for (const e of listMember) {
            io.to(e).emit("receive-notification-join-group", { channelName, channelId, data });
        }
    })

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});

server.listen(3000, () => {
    console.log("WebSocket server listening on port 3000");
});
