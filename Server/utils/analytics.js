import { prisma } from "../index.js"

// Get vote analytics for a poll
export async function getVoteAnalytics(pollId, timeframe = "24h") {
    try {
        const now = new Date()
        let startTime

        switch (timeframe) {
            case "1h":
                startTime = new Date(now.getTime() - 60 * 60 * 1000)
                break
            case "6h":
                startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000)
                break
            case "24h":
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
                break
            case "7d":
                startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                break
            default:
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }

        const votes = await prisma.vote.findMany({
            where: {
                pollId,
                createdAt: {
                    gte: startTime,
                },
            },
            include: {
                option: {
                    select: {
                        id: true,
                        text: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        })

        // Group votes by hour
        const hourlyData = {}
        const optionCounts = {}

        votes.forEach((vote) => {
            const hour = vote.createdAt.toISOString().slice(0, 13) + ":00:00.000Z"

            if (!hourlyData[hour]) {
                hourlyData[hour] = 0
            }
            hourlyData[hour]++

            if (!optionCounts[vote.option.id]) {
                optionCounts[vote.option.id] = {
                    text: vote.option.text,
                    count: 0,
                }
            }
            optionCounts[vote.option.id].count++
        })

        // Calculate velocity (votes per hour trend)
        const hours = Object.keys(hourlyData).sort()
        let velocity = 0
        if (hours.length >= 2) {
            const recent = hourlyData[hours[hours.length - 1]] || 0
            const previous = hourlyData[hours[hours.length - 2]] || 0
            velocity = recent - previous
        }

        return {
            totalVotes: votes.length,
            timeframe,
            hourlyData,
            optionCounts,
            velocity,
            peakHour: hours.reduce((peak, hour) => (hourlyData[hour] > (hourlyData[peak] || 0) ? hour : peak), hours[0]),
        }
    } catch (error) {
        console.error("Error getting vote analytics:", error)
        throw error
    }
}

// Detect voting patterns and anomalies
export async function detectVotingAnomalies(pollId) {
    try {
        const votes = await prisma.vote.findMany({
            where: { pollId },
            select: {
                deviceHash: true,
                ipHash: true,
                createdAt: true,
                optionId: true,
            },
        })

        const deviceCounts = {}
        const ipCounts = {}
        const rapidVotes = []

        votes.forEach((vote, index) => {
            // Count votes per device
            deviceCounts[vote.deviceHash] = (deviceCounts[vote.deviceHash] || 0) + 1

            // Count votes per IP
            ipCounts[vote.ipHash] = (ipCounts[vote.ipHash] || 0) + 1

            // Check for rapid voting (within 5 seconds)
            if (index > 0) {
                const timeDiff = vote.createdAt.getTime() - votes[index - 1].createdAt.getTime()
                if (timeDiff < 5000) {
                    // 5 seconds
                    rapidVotes.push({
                        vote1: votes[index - 1],
                        vote2: vote,
                        timeDiff,
                    })
                }
            }
        })

        // Find suspicious patterns
        const suspiciousDevices = Object.entries(deviceCounts)
            .filter(([_, count]) => count > 3)
            .map(([device, count]) => ({ device, count }))

        const suspiciousIPs = Object.entries(ipCounts)
            .filter(([_, count]) => count > 5)
            .map(([ip, count]) => ({ ip, count }))

        return {
            totalVotes: votes.length,
            suspiciousDevices,
            suspiciousIPs,
            rapidVotes: rapidVotes.length,
            anomalyScore: calculateAnomalyScore(suspiciousDevices, suspiciousIPs, rapidVotes),
        }
    } catch (error) {
        console.error("Error detecting voting anomalies:", error)
        throw error
    }
}

function calculateAnomalyScore(suspiciousDevices, suspiciousIPs, rapidVotes) {
    let score = 0

    // Add points for suspicious devices
    score += suspiciousDevices.length * 10

    // Add points for suspicious IPs
    score += suspiciousIPs.length * 15

    // Add points for rapid votes
    score += rapidVotes.length * 5

    // Normalize to 0-100 scale
    return Math.min(100, score)
}
