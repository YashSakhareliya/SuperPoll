import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { BarChart3, TrendingUp, Users, Clock, ArrowLeft } from 'lucide-react'
import { pollsAPI } from '../utils/api'
import { useToast } from '../hooks/use-toast'

const Analytics = () => {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const creatorSecret = searchParams.get('creatorSecret')
    const { toast } = useToast()
    
    const [loading, setLoading] = useState(true)
    const [analytics, setAnalytics] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!creatorSecret) {
            setError('Creator secret required')
            setLoading(false)
            return
        }

        fetchAnalytics()
    }, [id, creatorSecret])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)
            const response = await pollsAPI.getPollStats(id, creatorSecret)
            setAnalytics(response.data)
        } catch (error) {
            console.error('Error fetching analytics:', error)
            setError(error.response?.data?.error || 'Failed to load analytics')
            toast({
                title: "Error",
                description: error.response?.data?.error || 'Failed to load analytics',
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

    return (
        <div className="min-h-screen bg-base-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-base-content">
                            Poll Analytics
                        </h1>
                        <p className="text-base-content/60 mt-1">
                            {analytics?.poll?.question}
                        </p>
                    </div>
                    <button onClick={goBack} className="btn btn-ghost">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Close
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-base-content/60 text-sm">Total Votes</p>
                                    <p className="text-2xl font-bold">{analytics?.totalVotes || 0}</p>
                                </div>
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-base-content/60 text-sm">Recent Votes (24h)</p>
                                    <p className="text-2xl font-bold">{analytics?.recentVotes || 0}</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-success" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-base-content/60 text-sm">Poll Status</p>
                                    <p className="text-lg font-bold">
                                        {analytics?.poll?.isExpired ? 'Expired' : 'Active'}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-warning" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-base-content/60 text-sm">Created</p>
                                    <p className="text-sm font-medium">
                                        {new Date(analytics?.poll?.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-info" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Options Results */}
                <div className="card bg-base-100 shadow-xl mb-8">
                    <div className="card-body">
                        <h2 className="card-title mb-4">Vote Results</h2>
                        <div className="space-y-4">
                            {analytics?.options?.map((option, index) => (
                                <div key={option.id} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{option.text}</span>
                                        <span className="text-sm text-base-content/60">
                                            {option.votesCount} votes ({option.percentage}%)
                                        </span>
                                    </div>
                                    <div className="w-full bg-base-300 rounded-full h-3">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-500 ${
                                                index === 0 ? 'bg-primary' : 
                                                index === 1 ? 'bg-secondary' : 
                                                index === 2 ? 'bg-accent' : 'bg-neutral'
                                            }`}
                                            style={{ width: `${option.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Insights */}
                {analytics?.insight && (
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h2 className="card-title mb-4">AI Insights</h2>
                            <div className="alert alert-info">
                                <TrendingUp className="h-5 w-5" />
                                <span>{analytics.insight}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Analytics
