import { prisma } from "../index.js"

// Enhanced insight generation with multiple analysis types
export function generateInsight(poll, options, votes = null) {
  const totalVotes = poll.votesCount

  if (totalVotes < 20) {
    return null
  }

  // Sort options by vote count
  const sortedOptions = options
    .map((option) => ({
      ...option,
      percentage: totalVotes > 0 ? (option.votesCount / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.votesCount - a.votesCount)

  const topOption = sortedOptions[0]
  const secondOption = sortedOptions[1]
  const thirdOption = sortedOptions[2]

  // Calculate margin
  const margin = topOption.percentage - (secondOption?.percentage || 0)

  // Generate different types of insights based on voting patterns
  const insights = []

  // 1. Clear leader analysis
  if (topOption.percentage >= 60 && margin >= 20) {
    insights.push(`${topOption.text} dominates with ${topOption.percentage.toFixed(1)}% - a decisive victory!`)
  } else if (topOption.percentage >= 55 && margin >= 15) {
    insights.push(
      `${topOption.text} leads clearly with ${topOption.percentage.toFixed(1)}%, showing strong preference.`,
    )
  } else if (topOption.percentage >= 50 && margin >= 10) {
    insights.push(
      `${topOption.text} takes the lead with ${topOption.percentage.toFixed(1)}%, ahead by ${margin.toFixed(1)}%.`,
    )
  }

  // 2. Close race analysis
  else if (margin < 3 && secondOption) {
    insights.push(
      `Neck-and-neck race! ${topOption.text} (${topOption.percentage.toFixed(1)}%) barely edges out ${secondOption.text} (${secondOption.percentage.toFixed(1)}%).`,
    )
  } else if (margin < 8 && secondOption) {
    insights.push(
      `Close contest between ${topOption.text} (${topOption.percentage.toFixed(1)}%) and ${secondOption.text} (${secondOption.percentage.toFixed(1)}%).`,
    )
  }

  // 3. Three-way analysis
  else if (sortedOptions.length >= 3 && thirdOption) {
    const topThreeTotal = topOption.percentage + secondOption.percentage + thirdOption.percentage
    if (topThreeTotal > 85 && Math.abs(topOption.percentage - secondOption.percentage) < 10) {
      insights.push(
        `Three-horse race: ${topOption.text} (${topOption.percentage.toFixed(1)}%), ${secondOption.text} (${secondOption.percentage.toFixed(1)}%), ${thirdOption.text} (${thirdOption.percentage.toFixed(1)}%).`,
      )
    }
  }

  // 4. Default analysis
  if (insights.length === 0) {
    insights.push(`${topOption.text} leads with ${topOption.percentage.toFixed(1)}%, margin ${margin.toFixed(1)}%.`)
  }

  return insights[0]
}

// Generate comprehensive poll analytics and insights
export async function generateAdvancedInsights(pollId) {
  try {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { order: "asc" },
        },
        votes: {
          select: {
            createdAt: true,
            optionId: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!poll || poll.votesCount < 20) {
      return null
    }

    const insights = {
      primary: generateInsight(poll, poll.options),
      trends: analyzeTrends(poll.votes, poll.options),
      timing: analyzeVotingTiming(poll.votes),
      momentum: analyzeMomentum(poll.votes, poll.options),
      participation: analyzeParticipation(poll),
    }

    return insights
  } catch (error) {
    console.error("Error generating advanced insights:", error)
    return null
  }
}

// Analyze voting trends over time
function analyzeTrends(votes, options) {
  if (votes.length < 20) return null

  const optionMap = new Map(options.map((opt) => [opt.id, opt.text]))
  const timeWindows = divideIntoTimeWindows(votes, 4) // Divide into 4 quarters

  const trends = []

  // Compare first quarter vs last quarter
  const firstQuarter = timeWindows[0]
  const lastQuarter = timeWindows[timeWindows.length - 1]

  if (firstQuarter.length > 0 && lastQuarter.length > 0) {
    const firstLeader = getMostVotedOption(firstQuarter, optionMap)
    const lastLeader = getMostVotedOption(lastQuarter, optionMap)

    if (firstLeader.optionId !== lastLeader.optionId) {
      trends.push(`Momentum shift: ${lastLeader.text} overtook ${firstLeader.text} as voting progressed.`)
    } else {
      const firstPercentage = (firstLeader.count / firstQuarter.length) * 100
      const lastPercentage = (lastLeader.count / lastQuarter.length) * 100
      const change = lastPercentage - firstPercentage

      if (Math.abs(change) > 10) {
        if (change > 0) {
          trends.push(
            `${lastLeader.text} gained momentum, increasing from ${firstPercentage.toFixed(1)}% to ${lastPercentage.toFixed(1)}%.`,
          )
        } else {
          trends.push(
            `${lastLeader.text} lost steam, dropping from ${firstPercentage.toFixed(1)}% to ${lastPercentage.toFixed(1)}%.`,
          )
        }
      }
    }
  }

  return trends.length > 0 ? trends[0] : null
}

// Analyze voting timing patterns
function analyzeVotingTiming(votes) {
  if (votes.length < 20) return null

  const hourCounts = new Array(24).fill(0)
  const dayOfWeekCounts = new Array(7).fill(0)

  votes.forEach((vote) => {
    const date = new Date(vote.createdAt)
    hourCounts[date.getHours()]++
    dayOfWeekCounts[date.getDay()]++
  })

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
  const peakDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts))

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const timeOfDay = peakHour < 6 ? "early morning" : peakHour < 12 ? "morning" : peakHour < 18 ? "afternoon" : "evening"

  return `Peak voting: ${timeOfDay} (${peakHour}:00) on ${dayNames[peakDay]}s.`
}

// Analyze voting momentum and velocity
function analyzeMomentum(votes, options) {
  if (votes.length < 30) return null

  const recentVotes = votes.slice(-Math.floor(votes.length / 3)) // Last third of votes
  const earlierVotes = votes.slice(0, Math.floor(votes.length / 3)) // First third of votes

  const recentLeader = getMostVotedOption(recentVotes, new Map(options.map((opt) => [opt.id, opt.text])))
  const earlierLeader = getMostVotedOption(earlierVotes, new Map(options.map((opt) => [opt.id, opt.text])))

  const recentVelocity = recentVotes.length
  const earlierVelocity = earlierVotes.length

  if (recentVelocity > earlierVelocity * 1.5) {
    return `Voting accelerated recently with ${recentLeader.text} gaining traction.`
  } else if (recentVelocity < earlierVelocity * 0.7) {
    return `Voting slowed down as ${recentLeader.text} maintained its lead.`
  }

  return null
}

// Analyze participation patterns
function analyzeParticipation(poll) {
  const totalVotes = poll.votesCount
  const timeElapsed = new Date() - new Date(poll.createdAt)
  const hoursElapsed = timeElapsed / (1000 * 60 * 60)

  const votesPerHour = totalVotes / hoursElapsed

  if (votesPerHour > 10) {
    return `High engagement: ${votesPerHour.toFixed(1)} votes per hour.`
  } else if (votesPerHour > 5) {
    return `Steady participation: ${votesPerHour.toFixed(1)} votes per hour.`
  } else if (votesPerHour > 1) {
    return `Moderate engagement: ${votesPerHour.toFixed(1)} votes per hour.`
  }

  return `Gradual participation: ${votesPerHour.toFixed(1)} votes per hour.`
}

// Helper function to divide votes into time windows
function divideIntoTimeWindows(votes, numWindows) {
  const windows = []
  const windowSize = Math.floor(votes.length / numWindows)

  for (let i = 0; i < numWindows; i++) {
    const start = i * windowSize
    const end = i === numWindows - 1 ? votes.length : (i + 1) * windowSize
    windows.push(votes.slice(start, end))
  }

  return windows
}

// Helper function to get most voted option in a set of votes
function getMostVotedOption(votes, optionMap) {
  const counts = {}

  votes.forEach((vote) => {
    counts[vote.optionId] = (counts[vote.optionId] || 0) + 1
  })

  const topOptionId = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))

  return {
    optionId: topOptionId,
    text: optionMap.get(topOptionId),
    count: counts[topOptionId],
  }
}

// Generate insight summary for display
export function generateInsightSummary(poll, options, votes = null) {
  const basicInsight = generateInsight(poll, options, votes)

  if (!basicInsight) return null

  // Add contextual information
  const totalVotes = poll.votesCount
  const timeElapsed = new Date() - new Date(poll.createdAt)
  const hoursElapsed = Math.floor(timeElapsed / (1000 * 60 * 60))

  let context = ""
  if (hoursElapsed < 1) {
    context = " (within the first hour)"
  } else if (hoursElapsed < 24) {
    context = ` (after ${hoursElapsed} hours)`
  } else {
    const daysElapsed = Math.floor(hoursElapsed / 24)
    context = ` (after ${daysElapsed} day${daysElapsed > 1 ? "s" : ""})`
  }

  return {
    text: basicInsight + context,
    confidence: calculateConfidence(poll, options),
    category: categorizeInsight(poll, options),
  }
}

// Calculate confidence level of the insight
function calculateConfidence(poll, options) {
  const totalVotes = poll.votesCount
  const sortedOptions = options
    .map((option) => ({
      ...option,
      percentage: totalVotes > 0 ? (option.votesCount / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.votesCount - a.votesCount)

  const topOption = sortedOptions[0]
  const secondOption = sortedOptions[1]
  const margin = topOption.percentage - (secondOption?.percentage || 0)

  if (totalVotes >= 100 && margin >= 20) return "high"
  if (totalVotes >= 50 && margin >= 15) return "high"
  if (totalVotes >= 30 && margin >= 10) return "medium"
  if (margin < 5) return "low"

  return "medium"
}

// Categorize the type of insight
function categorizeInsight(poll, options) {
  const totalVotes = poll.votesCount
  const sortedOptions = options
    .map((option) => ({
      ...option,
      percentage: totalVotes > 0 ? (option.votesCount / totalVotes) * 100 : 0,
    }))
    .sort((a, b) => b.votesCount - a.votesCount)

  const topOption = sortedOptions[0]
  const secondOption = sortedOptions[1]
  const margin = topOption.percentage - (secondOption?.percentage || 0)

  if (topOption.percentage >= 60) return "dominant"
  if (margin < 5) return "competitive"
  if (margin >= 15) return "clear_leader"

  return "moderate_lead"
}
