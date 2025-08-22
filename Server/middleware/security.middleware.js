import { redis } from "../index.js";
import rateLimit from "express-rate-limit";

// ip validating 
export const detectSuspiciousActivity = async (req, res, next) => {
    try {
      const ip = req.ip
      const userAgent = req.headers["user-agent"] || ""
  
      // Check for missing or suspicious user agent
      if (!userAgent || userAgent.length < 10) {
        const suspiciousKey = `suspicious:${ip}`
        const count = await redis.incr(suspiciousKey)
        await redis.expire(suspiciousKey, 3600) // 1 hour
  
        if (count > 10) {
          return res.status(429).json({
            error: "Suspicious activity detected. Please try again later.",
          })
        }
      }
  
      // Check for rapid requests from same IP
      const rapidKey = `rapid:${ip}`
      const rapidCount = await redis.incr(rapidKey)
      await redis.expire(rapidKey, 10) // 10 seconds
  
      if (rapidCount > 5) {
        return res.status(429).json({
          error: "Too many rapid requests. Please slow down.",
        })
      }
  
      next()
    } catch (error) {
      console.error("Error in suspicious activity detection:", error)
      next() // Continue on error
    }
  }
  