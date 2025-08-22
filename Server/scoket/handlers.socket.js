import { prisma } from "../index.js";
import { redis } from "../index.js";
import { generateInsight } from "../utils/index.js";
import { getVoteAnalytics, detectVotingAnomalies } from "../utils/index.js";

// socket event handle
export function setupSocketHandlers(io) {
    // Middleware for socket authentication and validation
    io.use(async (socket, next) => {
        try {
            // Log connection attempt
            console.log(`Socket connection attempt: ${socket.id} from ${socket.handshake.address}`)

            // Rate limit socket connections per IP
            const ip = socket.handshake.address
            const connectionKey = `socket_conn:${ip}`
            const connections = await redis.incr(connectionKey)
            await redis.expire(connectionKey, 60) // 1 minute window

            if (connections > 20) {
                return next(new Error("Too many socket connections from this IP"))
            }

            next()
        } catch (error) {
            console.error("Socket middleware error:", error)
            next(new Error("Authentication failed"))
        }
    })

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.id}`)

        // Store connection info
        socket.data = {
            connectedAt: new Date(),
            ip: socket.handshake.address,
            userAgent: socket.handshake.headers["user-agent"],
            rooms: new Set(),
        }

        // Handle joining a poll room
        socket.on("join-poll", async (data) => {
            try {
                const { pollId, creatorSecret } = data || {}

                if (!pollId || typeof pollId !== "string") {
                    socket.emit("error", { message: "Invalid poll ID" })
                    return
                }

                // Validate poll exists
                const poll = await prisma.poll.findUnique({
                    where: { id: pollId },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                        },
                    },
                })

                if (!poll) {
                    socket.emit("error", { message: "Poll not found" })
                    return
                }

                // Join the poll room
                socket.join(`poll:${pollId}`)
                socket.data.rooms.add(`poll:${pollId}`)

                // Check if user is creator
                const isCreator = creatorSecret === poll.creatorSecret

                // Send initial poll data
                const pollData = {
                    id: poll.id,
                    question: poll.question,
                    expiresAt: poll.expiresAt,
                    hideResultsUntilVoted: poll.hideResultsUntilVoted,
                    votesCount: poll.votesCount,
                    isExpired: new Date() > poll.expiresAt,
                    isCreator,
                    options: poll.options.map((opt) => ({
                        id: opt.id,
                        text: opt.text,
                        votesCount: opt.votesCount,
                        percentage: poll.votesCount > 0 ? (opt.votesCount / poll.votesCount) * 100 : 0,
                    })),
                }

                // Add insight if available
                if (poll.votesCount >= 20) {
                    pollData.insight = generateInsight(poll, poll.options)
                }

                socket.emit("poll-data", pollData)

                // Send analytics to creator
                if (isCreator) {
                    try {
                        const analytics = await getVoteAnalytics(pollId, "24h")
                        const anomalies = await detectVotingAnomalies(pollId)
                        socket.emit("poll-analytics", { analytics, anomalies })
                    } catch (error) {
                        console.error("Error sending analytics:", error)
                    }
                }

                // Notify room about new viewer
                socket.to(`poll:${pollId}`).emit("viewer-joined", {
                    viewerCount: io.sockets.adapter.rooms.get(`poll:${pollId}`)?.size || 0,
                })

                console.log(`Socket ${socket.id} joined poll:${pollId}`)
            } catch (error) {
                console.error("Error joining poll:", error)
                socket.emit("error", { message: "Failed to join poll" })
            }
        })

        // Handle leaving a poll room
        socket.on("leave-poll", (pollId) => {
            try {
                if (!pollId) return

                socket.leave(`poll:${pollId}`)
                socket.data.rooms.delete(`poll:${pollId}`)

                // Notify room about viewer leaving
                socket.to(`poll:${pollId}`).emit("viewer-left", {
                    viewerCount: io.sockets.adapter.rooms.get(`poll:${pollId}`)?.size || 0,
                })

                console.log(`Socket ${socket.id} left poll:${pollId}`)
            } catch (error) {
                console.error("Error leaving poll:", error)
            }
        })

        // Handle poll settings update (creator only)
        socket.on("update-poll-settings", async (data) => {
            try {
                const { pollId, creatorSecret, hideResultsUntilVoted } = data

                if (!pollId || !creatorSecret) {
                    socket.emit("error", { message: "Missing required fields" })
                    return
                }

                const poll = await prisma.poll.findUnique({
                    where: { id: pollId },
                })

                if (!poll) {
                    socket.emit("error", { message: "Poll not found" })
                    return
                }

                if (poll.creatorSecret !== creatorSecret) {
                    socket.emit("error", { message: "Unauthorized" })
                    return
                }

                if (new Date() > poll.expiresAt) {
                    socket.emit("error", { message: "Poll has expired" })
                    return
                }

                // Update poll settings
                const updatedPoll = await prisma.poll.update({
                    where: { id: pollId },
                    data: { hideResultsUntilVoted: Boolean(hideResultsUntilVoted) },
                })

                // Broadcast settings update to all viewers
                io.to(`poll:${pollId}`).emit("poll-settings-updated", {
                    hideResultsUntilVoted: updatedPoll.hideResultsUntilVoted,
                })

                socket.emit("settings-updated", { success: true })
            } catch (error) {
                console.error("Error updating poll settings:", error)
                socket.emit("error", { message: "Failed to update settings" })
            }
        })

        // Handle request for real-time analytics (creator only)
        socket.on("request-analytics", async (data) => {
            try {
                const { pollId, creatorSecret, timeframe = "24h" } = data

                if (!pollId || !creatorSecret) {
                    socket.emit("error", { message: "Missing required fields" })
                    return
                }

                const poll = await prisma.poll.findUnique({
                    where: { id: pollId },
                })

                if (!poll || poll.creatorSecret !== creatorSecret) {
                    socket.emit("error", { message: "Unauthorized" })
                    return
                }

                const analytics = await getVoteAnalytics(pollId, timeframe)
                const anomalies = await detectVotingAnomalies(pollId)

                socket.emit("poll-analytics", { analytics, anomalies })
            } catch (error) {
                console.error("Error sending analytics:", error)
                socket.emit("error", { message: "Failed to get analytics" })
            }
        })

        // Handle heartbeat/ping
        socket.on("ping", () => {
            socket.emit("pong", { timestamp: Date.now() })
        })

        // Handle disconnect
        socket.on("disconnect", (reason) => {
            console.log(`User disconnected: ${socket.id}, reason: ${reason}`)

            // Notify all rooms about viewer leaving
            socket.data.rooms.forEach((room) => {
                const pollId = room.replace("poll:", "")
                socket.to(room).emit("viewer-left", {
                    viewerCount: Math.max(0, (io.sockets.adapter.rooms.get(room)?.size || 1) - 1),
                })
            })
        })

        // Handle connection errors
        socket.on("error", (error) => {
            console.error(`Socket error for ${socket.id}:`, error)
        })
    })

    // Broadcast poll expiry notifications
    setInterval(async () => {
        try {
            const now = new Date()
            const soonToExpire = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes from now

            const expiringPolls = await prisma.poll.findMany({
                where: {
                    expiresAt: {
                        gte: now,
                        lte: soonToExpire,
                    },
                },
                select: { id: true, expiresAt: true },
            })

            expiringPolls.forEach((poll) => {
                const timeLeft = poll.expiresAt.getTime() - now.getTime()
                io.to(`poll:${poll.id}`).emit("poll-expiring", {
                    timeLeft: Math.max(0, timeLeft),
                    expiresAt: poll.expiresAt,
                })
            })

            // Check for just expired polls
            const justExpired = await prisma.poll.findMany({
                where: {
                    expiresAt: {
                        gte: new Date(now.getTime() - 60 * 1000), // 1 minute ago
                        lt: now,
                    },
                },
                select: { id: true },
            })

            justExpired.forEach((poll) => {
                io.to(`poll:${poll.id}`).emit("poll-expired", {
                    pollId: poll.id,
                    expiredAt: now,
                })
            })
        } catch (error) {
            console.error("Error checking poll expiry:", error)
        }
    }, 60 * 1000) // Check every minute
}

// vote update event broadcast
export function broadcastVoteUpdate(io, pollId, pollData) {
    try {
        const updateData = {
            pollId,
            votesCount: pollData.votesCount,
            options: pollData.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                votesCount: opt.votesCount,
                percentage: pollData.votesCount > 0 ? (opt.votesCount / pollData.votesCount) * 100 : 0,
            })),
            timestamp: new Date().toISOString(),
        }

        // Add insight if enough votes
        if (pollData.votesCount >= 20) {
            updateData.insight = generateInsight(pollData, pollData.options)
        }

        io.to(`poll:${pollId}`).emit("vote_update", updateData)

        // Send analytics update to creators
        io.to(`poll:${pollId}`).emit("analytics_update", {
            totalVotes: pollData.votesCount,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        console.error("Error broadcasting vote update:", error)
    }
}

// broadcast poll deleation
export function broadcastPollDeleted(io, pollId) {
    try {
        io.to(`poll:${pollId}`).emit("poll-deleted", {
            pollId,
            message: "This poll has been deleted by its creator",
        })
    } catch (error) {
        console.error("Error broadcasting poll deletion:", error)
    }
}