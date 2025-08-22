import { createServer } from "http"
import { Server } from "socket.io"
import dotenv from "dotenv"
import app, { prisma, redis } from './index.js'
import cors from 'cors';

dotenv.config();

const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Import socket handlers and jobs
import { setupSocketHandlers } from "./socket/handlers.socket.js"
import { scheduleCleanup } from "./jobs/cleanup.js"

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
