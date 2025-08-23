import { prisma } from "../index.js"
import { hashToken, hashDevice, hashIP, hashIPSubnet, generateVoteToken } from "../utils/index.js"
import { v4 as uuidv4 } from "uuid"
import { broadcastVoteUpdate } from "../scoket/handlers.socket.js"

const castVote = async (req, res) => {
    try {
        const { id: pollId } = req.params
        const { optionId, fingerprint = {} } = req.body
        const idempotencyKey = req.headers["idempotency-key"] || uuidv4()

        // Get client info for enhanced fingerprinting
        const userAgent = req.headers["user-agent"] || ""
        const clientIP = req.ip || req.connection.remoteAddress || "unknown"

        // Generate or get vote token from cookie
        let voteToken = req.cookies[`vote_${pollId}`]
        if (!voteToken) {
            voteToken = generateVoteToken()
        }

        // Create enhanced hashes
        const tokenHash = hashToken(pollId, voteToken)
        const deviceHash = hashDevice(userAgent, clientIP, fingerprint)
        const ipHash = hashIP(clientIP)
        const ipSubnetHash = hashIPSubnet(clientIP)

        if (!optionId) {
            return res.status(400).json({ error: "Option ID is required" })
        }

        // Check if poll exists and is not expired
        const poll = await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                options: true,
            },
        })

        if (!poll) {
            return res.status(404).json({ error: "Poll not found" })
        }

        if (new Date() > poll.expiresAt) {
            return res.status(410).json({ error: "Poll has expired" })
        }

        // Check if option exists
        const option = poll.options.find((opt) => opt.id === optionId)
        if (!option) {
            return res.status(400).json({ error: "Invalid option" })
        }

        try {
            // Enhanced duplicate vote detection
            const result = await prisma.$transaction(async (tx) => {
                // Check for existing vote by multiple criteria
                const existingVote = await tx.vote.findFirst({
                    where: {
                        pollId,
                        OR: [
                            { tokenHash },
                            { deviceHash }, // Primary device-based check
                        ],
                    },
                    include: {
                        option: true,
                    },
                })

                if (existingVote) {
                    return {
                        alreadyVoted: true,
                        yourChoice: {
                            id: existingVote.option.id,
                            text: existingVote.option.text,
                        },
                        reason: existingVote.tokenHash === tokenHash ? 'cookie' : 'device'
                    }
                }

                // Additional IP-based suspicious activity check
                const recentVotesFromIP = await tx.vote.count({
                    where: {
                        pollId,
                        ipHash,
                        createdAt: {
                            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
                        },
                    },
                })

                // Allow max 3 votes per IP per hour (for shared networks)
                if (recentVotesFromIP >= 3) {
                    return {
                        alreadyVoted: true,
                        yourChoice: null,
                        reason: 'ip_limit'
                    }
                }

                // Create the vote
                const vote = await tx.vote.create({
                    data: {
                        pollId,
                        optionId,
                        tokenHash,
                        deviceHash,
                        idempotencyKey,
                        ipHash,
                    },
                })

                // Update counters
                await tx.option.update({
                    where: { id: optionId },
                    data: { votesCount: { increment: 1 } },
                })

                await tx.poll.update({
                    where: { id: pollId },
                    data: { votesCount: { increment: 1 } },
                })

                return { vote, alreadyVoted: false }
            })

            if (result.alreadyVoted) {
                const errorMessages = {
                    cookie: "You have already voted in this poll",
                    device: "A vote has already been cast from this device",
                    ip_limit: "Too many votes from this network. Please try again later."
                }

                return res.status(409).json({
                    error: errorMessages[result.reason] || "You have already voted in this poll",
                    yourChoice: result.yourChoice,
                    reason: result.reason
                })
            }

            // Set vote token cookie (still useful for quick detection)
            res.cookie(`vote_${pollId}`, voteToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            })

            // Get updated poll data for real-time broadcast
            const updatedPoll = await prisma.poll.findUnique({
                where: { id: pollId },
                include: {
                    options: {
                        orderBy: { order: "asc" },
                    },
                },
            })

            const io = req.app.get("io")
            broadcastVoteUpdate(io, pollId, updatedPoll)

            res.json({
                success: true,
                message: "Vote cast successfully",
                yourChoice: {
                    id: option.id,
                    text: option.text,
                },
                poll: {
                    id: updatedPoll.id,
                    votesCount: updatedPoll.votesCount,
                    options: updatedPoll.options.map((opt) => ({
                        id: opt.id,
                        text: opt.text,
                        votesCount: opt.votesCount,
                        percentage: updatedPoll.votesCount > 0 ? (opt.votesCount / updatedPoll.votesCount) * 100 : 0,
                    })),
                },
            })
        } catch (error) {
            // Handle unique constraint violations (duplicate votes)
            if (error.code === "P2002") {
                // Check what the user voted for
                const existingVote = await prisma.vote.findFirst({
                    where: {
                        OR: [
                            { pollId, tokenHash },
                            { pollId, deviceHash },
                            { pollId, idempotencyKey },
                        ],
                    },
                    include: {
                        option: true,
                    },
                })

                const reason = error.meta?.target?.includes('deviceHash') ? 'device' : 'cookie'

                return res.status(409).json({
                    error: reason === 'device' 
                        ? "A vote has already been cast from this device" 
                        : "You have already voted in this poll",
                    yourChoice: existingVote
                        ? {
                            id: existingVote.option.id,
                            text: existingVote.option.text,
                        }
                        : null,
                    reason
                })
            }

            throw error
        }
    } catch (error) {
        console.error("Error casting vote:", error)
        res.status(500).json({ error: "Failed to cast vote" })
    }
}

const voteStatus = async (req, res) => {
    try {
      const { id: pollId } = req.params
      const { fingerprint = {} } = req.body
  
      // Get vote token from cookie
      const voteToken = req.cookies[`vote_${pollId}`]
      const userAgent = req.headers["user-agent"] || ""
      const clientIP = req.ip || req.connection.remoteAddress || "unknown"
      
      // Create hashes for checking
      const tokenHash = voteToken ? hashToken(pollId, voteToken) : null
      const deviceHash = hashDevice(userAgent, clientIP, fingerprint)
  
      const existingVote = await prisma.vote.findFirst({
        where: {
          pollId,
          OR: [
            ...(tokenHash ? [{ tokenHash }] : []),
            { deviceHash },
          ],
        },
        include: {
          option: true,
        },
      })
  
      if (existingVote) {
        return res.json({
          hasVoted: true,
          yourChoice: {
            id: existingVote.option.id,
            text: existingVote.option.text,
          },
        })
      }
  
      res.json({ hasVoted: false })
    } catch (error) {
      console.error("Error checking vote status:", error)
      res.status(500).json({ error: "Failed to check vote status" })
    }
}

export { castVote, voteStatus }
