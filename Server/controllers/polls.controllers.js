import { prisma } from "../index.js";
import { parseQuickCreate, generateCreatorSecret, generatePollQR } from "../utils/index.js";
import { hashToken, hashDevice, hashIP, generateVoteToken, hashPassword, comparePassword } from "../utils/index.js";
import { generateInsight, generateInsightSummary } from "../utils/index.js";

const createPoll = async (req, res) => {
    try {
        const { question, options, expiryHours = 24, hideResultsUntilVoted = false, quickCreate } = req.body

        let parsedQuestion = question
        let parsedOptions = options

        // Handle quick-create mode
        if (quickCreate && typeof quickCreate === "string") {
            const parsed = parseQuickCreate(quickCreate)
            if (parsed) {
                parsedQuestion = parsed.question
                parsedOptions = parsed.options
            } else {
                return res.status(400).json({
                    error: "Invalid quick-create format. Use: 'Question? | Option A | Option B | Option C'",
                })
            }
        }

        // Validation
        if (!parsedQuestion || parsedQuestion.length > 120) {
            return res.status(400).json({
                error: "Question is required and must be 120 characters or less",
            })
        }

        if (!parsedOptions || !Array.isArray(parsedOptions) || parsedOptions.length < 2 || parsedOptions.length > 4) {
            return res.status(400).json({
                error: "Must provide 2-4 options",
            })
        }

        // Validate options
        for (const option of parsedOptions) {
            if (!option || typeof option !== "string" || option.length > 100) {
                return res.status(400).json({
                    error: "Each option must be a string with 100 characters or less",
                })
            }
        }

        if (expiryHours < 1 || expiryHours > 168) {
            return res.status(400).json({
                error: "Expiry must be between 1 and 168 hours (1 week)",
            })
        }

        // Create poll with transaction
        const creatorSecret = generateCreatorSecret()
        const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

        const poll = await prisma.$transaction(async (tx) => {
            const newPoll = await tx.poll.create({
                data: {
                    question: parsedQuestion,
                    expiresAt,
                    creatorSecret,
                    hideResultsUntilVoted: Boolean(hideResultsUntilVoted),
                },
            })

            // Create options
            const optionPromises = parsedOptions.map((optionText, index) =>
                tx.option.create({
                    data: {
                        pollId: newPoll.id,
                        text: optionText,
                        order: index,
                    },
                }),
            )

            const createdOptions = await Promise.all(optionPromises)

            return {
                ...newPoll,
                options: createdOptions,
            }
        })

        // Generate QR code
        const baseUrl = `${req.protocol}://${req.get("host")}`
        let qrCode = null
        try {
            qrCode = await generatePollQR(poll.id, baseUrl)
        } catch (error) {
            console.error("Failed to generate QR code:", error)
        }

        const shareUrl = `${baseUrl}/poll/${poll.id}`
        const ogUrl = `${baseUrl}/og/poll/${poll.id}`

        res.status(201).json({
            poll: {
                id: poll.id,
                question: poll.question,
                expiresAt: poll.expiresAt,
                hideResultsUntilVoted: poll.hideResultsUntilVoted,
                votesCount: poll.votesCount,
                createdAt: poll.createdAt,
                options: poll.options.map((opt) => ({
                    id: opt.id,
                    text: opt.text,
                    votesCount: opt.votesCount,
                    order: opt.order,
                })),
            },
            creatorSecret: poll.creatorSecret,
            shareUrl,
            ogUrl,
            qrCode,
        })
    } catch (error) {
        console.error("Error creating poll:", error)
        res.status(500).json({ error: "Failed to create poll" })
    }
}

const getPoll = async (req, res) => {
    try {
      const { id } = req.params
      const { creatorSecret } = req.query
  
      const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
          options: {
            orderBy: { order: "asc" },
          },
        },
      })
  
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" })
      }
  
      // Check if poll is expired
      const isExpired = new Date() > poll.expiresAt
      const isCreator = creatorSecret === poll.creatorSecret
  
      let insight = null
      let insightSummary = null
      if (poll.votesCount >= 20) {
        insightSummary = generateInsightSummary(poll, poll.options)
        insight = insightSummary?.text || generateInsight(poll, poll.options)
      }
  
      const response = {
        id: poll.id,
        question: poll.question,
        expiresAt: poll.expiresAt,
        hideResultsUntilVoted: poll.hideResultsUntilVoted,
        votesCount: poll.votesCount,
        createdAt: poll.createdAt,
        isExpired,
        isCreator,
        insight,
        insightSummary,
        options: poll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          votesCount: opt.votesCount,
          order: opt.order,
        })),
      }
  
      res.json(response)
    } catch (error) {
      console.error("Error fetching poll:", error)
      res.status(500).json({ error: "Failed to fetch poll" })
    }
}


const updatePoll = async (req, res) => {
    try {
      const { id } = req.params
      const { creatorSecret, hideResultsUntilVoted } = req.body
  
      if (!creatorSecret) {
        return res.status(401).json({ error: "Creator secret required" })
      }
  
      const poll = await prisma.poll.findUnique({
        where: { id },
      })
  
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" })
      }
  
      if (poll.creatorSecret !== creatorSecret) {
        return res.status(403).json({ error: "Invalid creator secret" })
      }
  
      // Check if poll is expired
      if (new Date() > poll.expiresAt) {
        return res.status(410).json({ error: "Poll has expired" })
      }
  
      const updatedPoll = await prisma.poll.update({
        where: { id },
        data: {
          hideResultsUntilVoted: Boolean(hideResultsUntilVoted),
        },
        include: {
          options: {
            orderBy: { order: "asc" },
          },
        },
      })
  
      res.json({
        id: updatedPoll.id,
        question: updatedPoll.question,
        expiresAt: updatedPoll.expiresAt,
        hideResultsUntilVoted: updatedPoll.hideResultsUntilVoted,
        votesCount: updatedPoll.votesCount,
        createdAt: updatedPoll.createdAt,
        options: updatedPoll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          votesCount: opt.votesCount,
          order: opt.order,
        })),
      })
    } catch (error) {
      console.error("Error updating poll settings:", error)
      res.status(500).json({ error: "Failed to update poll settings" })
    }
}



const deletePoll = async (req, res) => {
    try {
      const { id } = req.params
      const { creatorSecret } = req.body
  
      if (!creatorSecret) {
        return res.status(401).json({ error: "Creator secret required" })
      }
  
      const poll = await prisma.poll.findUnique({
        where: { id },
      })
  
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" })
      }
  
      if (poll.creatorSecret !== creatorSecret) {
        return res.status(403).json({ error: "Invalid creator secret" })
      }
  
      const io = req.app.get("io")
      broadcastPollDeleted(io, id)
  
      // Delete poll (cascade will handle options and votes)
      await prisma.poll.delete({
        where: { id },
      })
  
      res.json({ message: "Poll deleted successfully" })
    } catch (error) {
      console.error("Error deleting poll:", error)
      res.status(500).json({ error: "Failed to delete poll" })
    }
}

const getPollStats = async (req, res) => {
    try {
      const { id } = req.params
      const { creatorSecret } = req.query
  
      if (!creatorSecret) {
        return res.status(401).json({ error: "Creator secret required" })
      }
  
      const poll = await prisma.poll.findUnique({
        where: { id },
        include: {
          options: {
            orderBy: { order: "asc" },
          },
          votes: {
            select: {
              createdAt: true,
              optionId: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      })
  
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" })
      }
  
      if (poll.creatorSecret !== creatorSecret) {
        return res.status(403).json({ error: "Invalid creator secret" })
      }
  
      // Calculate hourly vote distribution for last 24 hours
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  
      const recentVotes = poll.votes.filter((vote) => vote.createdAt >= last24Hours)
  
      const hourlyStats = {}
      for (let i = 0; i < 24; i++) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
        const hourKey = hour.toISOString().slice(0, 13) + ":00:00.000Z"
        hourlyStats[hourKey] = 0
      }
  
      recentVotes.forEach((vote) => {
        const hourKey = vote.createdAt.toISOString().slice(0, 13) + ":00:00.000Z"
        if (hourlyStats[hourKey] !== undefined) {
          hourlyStats[hourKey]++
        }
      })
  
      const insight = poll.votesCount >= 20 ? generateInsight(poll, poll.options) : null
  
      res.json({
        poll: {
          id: poll.id,
          question: poll.question,
          votesCount: poll.votesCount,
          createdAt: poll.createdAt,
          expiresAt: poll.expiresAt,
          isExpired: now > poll.expiresAt,
        },
        options: poll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          votesCount: opt.votesCount,
          percentage: poll.votesCount > 0 ? ((opt.votesCount / poll.votesCount) * 100).toFixed(1) : 0,
        })),
        hourlyStats,
        insight,
        totalVotes: poll.votesCount,
        recentVotes: recentVotes.length,
      })
    } catch (error) {
      console.error("Error fetching poll stats:", error)
      res.status(500).json({ error: "Failed to fetch poll statistics" })
    }
}

const getPollQr = async (req, res) => {
    try {
      const { id } = req.params
      const { format = "png" } = req.query
  
      // Verify poll exists
      const poll = await prisma.poll.findUnique({
        where: { id },
        select: { id: true },
      })
  
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" })
      }
  
      const baseUrl = `${req.protocol}://${req.get("host")}`
  
      if (format === "svg") {
        const qrCode = await generatePollQRSVG(id, baseUrl)
  
        res.setHeader("Content-Type", "image/svg+xml")
        res.setHeader("Cache-Control", "public, max-age=3600")
        res.send(qrCode.svg)
      } else {
        const qrCode = await generatePollQR(id, baseUrl)
  
        // Convert data URL to buffer
        const base64Data = qrCode.dataUrl.replace(/^data:image\/png;base64,/, "")
        const buffer = Buffer.from(base64Data, "base64")
  
        res.setHeader("Content-Type", "image/png")
        res.setHeader("Cache-Control", "public, max-age=3600")
        res.send(buffer)
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
      res.status(500).json({ error: "Failed to generate QR code" })
    }
}

const getPollAdvanceInsights = async (req, res) => {
    try {
      const { id } = req.params
      const { creatorSecret } = req.query
  
      if (!creatorSecret) {
        return res.status(401).json({ error: "Creator secret required" })
      }
  
      const poll = await prisma.poll.findUnique({
        where: { id },
      })
  
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" })
      }
  
      if (poll.creatorSecret !== creatorSecret) {
        return res.status(403).json({ error: "Invalid creator secret" })
      }
  
      if (poll.votesCount < 20) {
        return res.json({
          message: "Advanced insights available after 20+ votes",
          currentVotes: poll.votesCount,
          votesNeeded: 20 - poll.votesCount,
        })
      }
  
      const insights = await generateAdvancedInsights(id)
  
      res.json({
        pollId: id,
        totalVotes: poll.votesCount,
        insights,
        generatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error generating advanced insights:", error)
      res.status(500).json({ error: "Failed to generate insights" })
    }
}

export { createPoll, getPoll, updatePoll, deletePoll, getPollStats, getPollQr, getPollAdvanceInsights }
