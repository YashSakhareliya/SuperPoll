import React from 'react'
import { TrendingUp, BarChart3, Clock, Users, Zap } from "lucide-react"

const InsightCard = ({ poll, insightSummary }) => {
    if (!poll.insight && !insightSummary) {
        return null
    }

    const getConfidenceColor = (confidence) => {
        switch (confidence) {
            case "high":
                return "bg-green-100 text-green-800 border-green-200"
            case "medium":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "low":
                return "bg-orange-100 text-orange-800 border-orange-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getCategoryIcon = (category) => {
        switch (category) {
            case "dominant":
                return <Zap className="h-4 w-4" />
            case "clear_leader":
                return <TrendingUp className="h-4 w-4" />
            case "competitive":
                return <BarChart3 className="h-4 w-4" />
            default:
                return <BarChart3 className="h-4 w-4" />
        }
    }

    const getCategoryLabel = (category) => {
        switch (category) {
            case "dominant":
                return "Dominant Lead"
            case "clear_leader":
                return "Clear Leader"
            case "competitive":
                return "Competitive Race"
            case "moderate_lead":
                return "Moderate Lead"
            default:
                return "Analysis"
        }
    }
    return (
        <div className="card border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-xl">
            {/* Card Header */}
            <div className="card-body pb-3">
                <div className="flex items-center justify-between text-lg">
                    {/* Title with Icon */}
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Poll Insight
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2">
                        {insightSummary?.confidence && (
                            <div
                                className={`badge badge-outline ${getConfidenceColor(
                                    insightSummary.confidence
                                )}`}
                            >
                                {insightSummary.confidence} confidence
                            </div>
                        )}
                        {insightSummary?.category && (
                            <div className="badge badge-secondary flex items-center gap-1">
                                {getCategoryIcon(insightSummary.category)}
                                {getCategoryLabel(insightSummary.category)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Card Content */}
                <p className="text-foreground font-medium leading-relaxed mt-3">
                    {insightSummary?.text || poll.insight}
                </p>

                {/* Footer Info */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {poll.votesCount} votes analyzed
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Updated in real-time
                    </div>
                </div>
            </div>
        </div>

    )
}

export default InsightCard
