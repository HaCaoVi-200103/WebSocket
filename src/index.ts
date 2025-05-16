import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);

// Tạo WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: any) => {
    console.log('Client connected');

    ws.on('message', (message: any) => {
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
