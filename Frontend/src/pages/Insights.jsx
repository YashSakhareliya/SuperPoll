import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Brain, TrendingUp, Clock, Activity, ArrowLeft, Zap } from 'lucide-react'
import { pollsAPI } from '../utils/api'
import { useToast } from '../hooks/use-toast'

const Insights = () => {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const creatorSecret = searchParams.get('creatorSecret')
    const { toast } = useToast()
    
    const [loading, setLoading] = useState(true)
    const [insights, setInsights] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!creatorSecret) {
            setError('Creator secret required')
            setLoading(false)
            return
        }

        fetchInsights()
    }, [id, creatorSecret])

    const fetchInsights = async () => {
        try {
            setLoading(true)
            const response = await pollsAPI.getPollInsights(id, creatorSecret)
            setInsights(response.data)
        } catch (error) {
            console.error('Error fetching insights:', error)
            setError(error.response?.data?.error || 'Failed to load insights')
            toast({
                title: "Error",
                description: error.response?.data?.error || 'Failed to load insights',
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const goBack = () => {
        window.close()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body text-center">
                        <h2 className="card-title text-error justify-center">Error</h2>
                        <p>{error}</p>
                        <button onClick={goBack} className="btn btn-primary">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // Handle case where poll doesn't have enough votes for insights
    if (insights?.message) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center">
                <div className="card bg-base-100 shadow-xl max-w-md">
                    <div className="card-body text-center">
                        <Brain className="h-16 w-16 mx-auto text-base-content/40 mb-4" />
                        <h2 className="card-title justify-center">Insights Coming Soon</h2>
                        <p className="text-base-content/60 mb-4">{insights.message}</p>
                        <div className="stats stats-vertical shadow">
                            <div className="stat">
                                <div className="stat-title">Current Votes</div>
                                <div className="stat-value text-primary">{insights.currentVotes}</div>
                            </div>
                            <div className="stat">
                                <div className="stat-title">Votes Needed</div>
                                <div className="stat-value text-secondary">{insights.votesNeeded}</div>
                            </div>
                        </div>
                        <button onClick={goBack} className="btn btn-primary mt-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-base-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-base-content flex items-center gap-2">
                            <Brain className="h-8 w-8 text-primary" />
                            Advanced Insights
                        </h1>
                        <p className="text-base-content/60 mt-1">
                            AI-powered analysis of your poll
                        </p>
                    </div>
                    <button onClick={goBack} className="btn btn-ghost">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Close
                    </button>
                </div>

                {/* Poll Info */}
                <div className="card bg-base-100 shadow-xl mb-6">
                    <div className="card-body">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-semibold">Poll ID: {insights?.pollId}</h2>
                                <p className="text-base-content/60">Total Votes: {insights?.totalVotes}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-base-content/60">Generated</p>
                                <p className="text-sm font-medium">
                                    {new Date(insights?.generatedAt).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insights Grid */}
                <div className="space-y-6">
                    {/* Primary Insight */}
                    {insights?.insights?.primary && (
                        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-primary" />
                                    Key Insight
                                </h3>
                                <p className="text-lg">{insights.insights.primary}</p>
                            </div>
                        </div>
                    )}

                    {/* Trends */}
                    {insights?.insights?.trends && (
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-success" />
                                    Voting Trends
                                </h3>
                                <p>{insights.insights.trends}</p>
                            </div>
                        </div>
                    )}

                    {/* Timing Analysis */}
                    {insights?.insights?.timing && (
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-warning" />
                                    Timing Patterns
                                </h3>
                                <p>{insights.insights.timing}</p>
                            </div>
                        </div>
                    )}

                    {/* Momentum */}
                    {insights?.insights?.momentum && (
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-info" />
                                    Voting Momentum
                                </h3>
                                <p>{insights.insights.momentum}</p>
                            </div>
                        </div>
                    )}

                    {/* Participation */}
                    {insights?.insights?.participation && (
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h3 className="card-title flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-accent" />
                                    Participation Analysis
                                </h3>
                                <p>{insights.insights.participation}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-8 p-4">
                    <p className="text-sm text-base-content/60">
                        Insights are generated using AI analysis of voting patterns and trends
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Insights
