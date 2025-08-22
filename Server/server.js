import { createServer } from "http"
import { Server } from "socket.io"
import dotenv from "dotenv"
import app from './index.js'

dotenv.config();

const PORT = process.env.PORT || 3000;
const server = createServer(app);

// Import socket handlers and jobs
import { setupSocketHandlers } from "./scoket/handlers.socket.js"
import { scheduleCleanup } from "./middleware/cleanup.middleware.js"

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

// setup socket handlers
setupSocketHandlers(io)

server.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
    console.log(`Socket.io server ready for real-time connections`)
    
    // schedule cleanup
    scheduleCleanup()
});
