import { prisma } from "../index.js"
import { redis } from "../index.js"

// Clean up expired polls and old votes
export async function cleanupExpiredPolls() {
    try {
        const now = new Date()

        // Find expired polls
        const expiredPolls = await prisma.poll.findMany({
            where: {
                expiresAt: {
                    lt: now,
                },
            },
            select: {
                id: true,
                createdAt: true,
            },
        })

        console.log(`Found ${expiredPolls.length} expired polls`)

        // Delete polls older than 30 days after expiry
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        const pollsToDelete = expiredPolls.filter((poll) => poll.createdAt < thirtyDaysAgo)

        if (pollsToDelete.length > 0) {
            const deletedPolls = await prisma.poll.deleteMany({
                where: {
                    id: {
                        in: pollsToDelete.map((p) => p.id),
                    },
                },
            })

            console.log(`Deleted ${deletedPolls.count} old expired polls`)
        }

        // Clean up old Redis keys
        await cleanupRedisKeys()

        return {
            expiredPolls: expiredPolls.length,
            deletedPolls: pollsToDelete.length,
        }
    } catch (error) {
        console.error("Error in cleanup job:", error)
        throw error
    }
}

// Clean up old Redis rate limiting keys
async function cleanupRedisKeys() {
    try {
        const patterns = ["device:*", "ip:*", "poll:*", "suspicious:*", "rapid:*"]

        for (const pattern of patterns) {
            const keys = await redis.keys(pattern)
            if (keys.length > 0) {
                // Check TTL and delete expired keys
                for (const key of keys) {
                    const ttl = await redis.ttl(key)
                    if (ttl === -1) {
                        // No expiry set
                        await redis.del(key)
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error cleaning up Redis keys:", error)
    }
}

// Schedule cleanup job
export function scheduleCleanup() {
    // Run cleanup every 6 hours
    setInterval(
        async () => {
            try {
                console.log("Running scheduled cleanup...")
                await cleanupExpiredPolls()
                console.log("Cleanup completed successfully")
            } catch (error) {
                console.error("Scheduled cleanup failed:", error)
            }
        },
        6 * 60 * 60 * 1000,
    ) // 6 hours

    // Run initial cleanup after 1 minute
    setTimeout(async () => {
        try {
            console.log("Running initial cleanup...")
            await cleanupExpiredPolls()
            console.log("Initial cleanup completed")
        } catch (error) {
            console.error("Initial cleanup failed:", error)
        }
    }, 60 * 1000) // 1 minute
}
