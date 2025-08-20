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
    if (action.type === "withdraw-action") {
        for (const id of userId) {
            io.to(id).emit("receive-withdraw-action", action);
        }
    } else {
        io.to(userId).emit("receive-deposit-action", action);
    }
    res.sendStatus(200);
});

io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    socket.on("register", (userId: string) => {
        socket.join(userId);
        console.log(`User ${userId} joined `);
    });

    socket.on("deposit-action", async (data) => {
        const { userId } = data;

        io.to(userId).emit("receive-deposit-action");
    })

    socket.on("withdraw-action", async (data) => {
        const { userId } = data;
        console.log("Socket onnn>>>>>>>>");

        io.to(userId).emit("receive-withdraw-action");
    })

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

    socket.on("notify-cancel-send-request-friend", async (data) => {
        const { receiverId, userId } = data;
        io.to(receiverId).emit("receive-notify-cancel-send-request-friend", { receiverId, userId });
    })

    socket.on("notify-join-group-by-code", async (res) => {
        const { listMember, channelName, channelId, data, name, avatar, admin } = res;
        console.log("res>>>>", res);

        for (const e of listMember) {
            console.log("listMember>>>>", e);
            io.to(e._id).emit("receive-notify-join-group-by-code", { channelName, channelId, data, name, avatar });
        }
        io.to(admin._id).emit("receive-notify-join-group-by-code", { channelName, channelId, data, name, avatar });
    })

    socket.on("notify-join-group-course-by-code", async (res) => {
        const { listMember, channelName, channelId, data, name, avatar, admin, newListMember } = res;

        for (const e of listMember) {
            console.log("listMember>>>>", e);
            io.to(e._id).emit("receive-notify-join-group-course-by-code", { channelName, channelId, data, name, avatar, newListMember });
        }
        io.to(admin._id).emit("receive-notify-join-group-course-by-code", { channelName, channelId, data, name, avatar, newListMember });
    })

    socket.on("notify-new-friend", async (data) => {
        const { receiverId, senderId } = data;
        try {
            await axios.post(`${process.env.BE_ORIGIN_URL}/social/send-friend-request`, {
                receiverId, userId: senderId._id
            });

            io.to(senderId._id).emit("receive-notify-new-friend", { receiverId, senderId });
            io.to(receiverId).emit("receive-notify-new-friend", { receiverId, senderId });
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
            console.log("sender>>>", sender);

            const newList = listMember.filter((x: any) => x._id !== sender)

            for (const member of newList) {
                const userId = member._id;
                console.log("listMember>>>", userId);

                const res: any = await axios.get(`${process.env.BE_ORIGIN_URL}/social/unread-count-message-group/${userId}?groupId=${channelId}`);

                const count = res.data.count ? res.data.count : 0;

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

            io.to(senderId).emit("receive-notify-status-friend-request", savedMessage);
        } catch (err) {
            console.error("Lỗi khi gửi API:", err);
        }
    })

    socket.on("notification-join-group", async (res) => {
        const { listMember, channelName, channelId, data, newMemberId, newList } = res;
        if (newMemberId && newMemberId.length > 0) {
            for (const e of newMemberId) {
                console.log("newMemberId>>>>", e);
                io.to(e).emit("receive-notification-join-group", { channelName, channelId, data, newList });
            }
        }
        for (const e of listMember) {
            console.log("listMember>>>>", e);
            io.to(e).emit("receive-notification-add-new-member-group", { channelName, channelId, data, newList });
        }
    })

    socket.on("edit-group", async (res) => {
        const { listMember, channelId, avatar, name } = res;
        for (const e of listMember) {
            io.to(e._id).emit("receive-edit-group", { name, channelId, avatar });
        }
    })
    socket.on("delete-group", async (res) => {
        const { listMember, channelId, channelName } = res;
        for (const e of listMember) {
            io.to(e._id).emit("receive-delete-group", { channelId, channelName });
        }
    })

    socket.on("remove-member-from-group", async (res) => {
        const { groupId, memberId, channelName } = res;
        io.to(memberId).emit("receive-remove-member-from-group", { groupId, memberId, channelName });
    })

    socket.on("leave-group", async (res) => {
        const { groupId, listMember, admin, userId } = res;
        for (const e of listMember) {
            io.to(e._id).emit("receive-leave-group", { groupId, listMember, userId });
        }
        io.to(admin._id).emit("receive-leave-group", { groupId, listMember, userId });
    })
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`WebSocket server listening on port ${process.env.PORT || 3000}`);
});
