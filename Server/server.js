import http from 'http';
import app from './index';
import cors from 'cors';
import { Server } from 'socket.io'
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// socket io
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
})

// set io to available in app
app.set("io", io)

server.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
    console.log(`Socket.io server ready for real-time connections`)
});
