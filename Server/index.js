import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { createClient } from "redis"
import dotenv from "dotenv"

// Import routes
import pollRoutes from "./routes/polls.route.js"
import votingRoutes from "./routes/voting.route.js"
import ogRoutes from "./routes/og.route.js"

// Import middleware
import { detectSuspiciousActivity } from "./middleware/security.middleware.js"

// Import OG controller for bot detection
import { graphMetaTag } from "./controllers/og.controllers.js"

dotenv.config()

const app = express()

// Initialize Prisma and Redis
export const prisma = new PrismaClient()
export const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})

// Connect to Redis
redis.connect().catch(console.error)

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
)

app.use(
  cors({
    origin: [
      "https://super-poll-rho.vercel.app",
      "http://localhost:5173",
      "http://localhost:3000"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Trust proxy for accurate IP addresses
app.set("trust proxy", 1)

// General API rate limiting (more lenient)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  message: "Too many requests from this IP, please try again later.",
})

// Apply general rate limiting to all API routes
app.use("/api/", generalLimiter)

// Vote-specific rate limiting (only for voting)
const voteLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 votes per minute (more strict)
  message: "Too many votes from this IP, please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply vote-specific rate limiting and suspicious activity detection only to voting endpoints
const applyVotingSecurity = (req, res, next) => {
  // Only apply to POST requests (voting) on poll endpoints
  if (req.method === 'POST' && req.path.match(/^\/[^\/]+$/)) {
    // This matches /api/polls/:id (cast vote)
    return voteLimiter(req, res, (err) => {
      if (err) return next(err)
      detectSuspiciousActivity(req, res, next)
    })
  }
  // Skip rate limiting for other requests (GET poll data, stats, etc.)
  next()
}

// Apply voting security only to voting endpoints
app.use("/api/polls", applyVotingSecurity)

// Bot detection middleware for social media crawlers
const isSocialBot = (userAgent) => {
  if (!userAgent) return false
  
  const botPatterns = [
    /facebookexternalhit/i,
    /whatsapp/i,
    /twitterbot/i,
    /telegrambot/i,
    /discordbot/i,
    /linkedinbot/i,
    /slackbot/i,
    /skypeuripreview/i,
    /microsoftpreview/i,
    /googlebot/i,
    /bingbot/i,
    /applebot/i,
    /redditbot/i,
    /snapchat/i
  ]
  
  return botPatterns.some(pattern => pattern.test(userAgent))
}

// Handle /poll/:id route - serve OG tags for bots, redirect regular users to frontend
app.get('/poll/:id', (req, res) => {
  const userAgent = req.get('User-Agent') || ''
  
  if (isSocialBot(userAgent)) {
    // Serve OG meta tags for social media bots
    console.log(`Bot detected: ${userAgent} requesting poll ${req.params.id}`)
    return graphMetaTag(req, res)
  }
  
  // For regular users, redirect to frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  res.redirect(`${frontendUrl}/poll/${req.params.id}`)
})

// Routes
app.use("/api/polls", pollRoutes)
app.use("/api/polls", votingRoutes) // Mount voting routes under /api/polls to match Frontend expectations
app.use('/og', ogRoutes)

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" })
})
export default app