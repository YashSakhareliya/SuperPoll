import { prisma } from "../index"
import { hashToken, hashDevice, hashIP, generateVoteToken } from "../utils/index"
import { v4 as uuidv4 } from "uuid"

const castVote = async (req, res) => {
    try {
        const { id: pollId } = req.params
        const { optionId } = req.body
        const idempotencyKey = req.headers["idempotency-key"] || uuidv4()

        // Get client info for fingerprinting
        const userAgent = req.headers["user-agent"] || ""
        const clientIP = req.ip || req.connection.remoteAddress || "unknown"

        // Generate or get vote token from cookie
        let voteToken = req.cookies[`vote_${pollId}`]
        if (!voteToken) {
            voteToken = generateVoteToken()
        }

        // Create hashes
        const tokenHash = hashToken(pollId, voteToken)
        const deviceHash = hashDevice(userAgent, clientIP)
        const ipHash = hashIP(clientIP)

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
            // Attempt to create vote with transaction
            const result = await prisma.$transaction(async (tx) => {
                // Check for existing vote by token
                const existingVote = await tx.vote.findFirst({
                    where: {
                        pollId,
                        tokenHash,
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
                return res.status(409).json({
                    error: "You have already voted in this poll",
                    yourChoice: result.yourChoice,
                })
            }

            // Set vote token cookie
            res.cookie(`vote_${pollId}`, voteToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
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
                            { pollId, idempotencyKey },
                        ],
                    },
                    include: {
                        option: true,
                    },
                })

                return res.status(409).json({
                    error: "You have already voted in this poll",
                    yourChoice: existingVote
                        ? {
                            id: existingVote.option.id,
                            text: existingVote.option.text,
                        }
                        : null,
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
  
      // Get vote token from cookie
      const voteToken = req.cookies[`vote_${pollId}`]
  
      if (!voteToken) {
        return res.json({ hasVoted: false })
      }
  
      const tokenHash = hashToken(pollId, voteToken)
  
      const existingVote = await prisma.vote.findFirst({
        where: {
          pollId,
          tokenHash,
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
