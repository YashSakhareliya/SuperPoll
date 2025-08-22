import React from 'react'
import { useState } from "react"
import { Settings, Trash2, Eye, EyeOff, BarChart3, TrendingUp } from "lucide-react"
import { useToast } from '../hooks/use-toast'
import { pollsAPI } from '../utils/api'

const CreatorPanel = ({ poll, creatorSecret, onSettingsUpdate }) => {
    const { toast } = useToast()
    const [updating, setUpdating] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const updateSettings = async (newSettings) => {
        setUpdating(true)
        try {
            const response = await pollsAPI.updatePollSettings(poll.id, {
                creatorSecret,
                ...newSettings,
            })

            onSettingsUpdate(newSettings)
            toast({
                title: "Settings updated",
                description: "Poll settings have been updated successfully.",
            })
        } catch (error) {
            toast({
                title: "Error updating settings",
                description: error.response?.data?.error || error.message,
                variant: "destructive",
            })
        } finally {
            setUpdating(false)
        }
    }


    const deletePoll = async () => {
        if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
            return
        }

        setDeleting(true)
        try {
            await pollsAPI.deletePoll(poll.id, creatorSecret)

            toast({
                title: "Poll deleted",
                description: "Your poll has been deleted successfully.",
            })

            // Redirect to home after a short delay
            setTimeout(() => {
                window.location.href = "/"
            }, 2000)
        } catch (error) {
            toast({
                title: "Error deleting poll",
                description: error.response?.data?.error || error.message,
                variant: "destructive",
            })
        } finally {
            setDeleting(false)
        }
    }

    const viewStats = () => {
        window.open(`/api/polls/${poll.id}/stats?creatorSecret=${creatorSecret}`, "_blank")
    }

    const viewAdvancedInsights = () => {
        window.open(`/api/polls/${poll.id}/insights?creatorSecret=${creatorSecret}`, "_blank")
    }


    return (
        <div className="card border shadow-md">
            {/* Card Header */}
            <div className="card-body pb-3">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    <Settings className="h-5 w-5" />
                    Creator Controls
                </div>
            </div>

            {/* Card Content */}
            <div className="card-body space-y-4 pt-0">
                {/* Settings */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {poll.hideResultsUntilVoted ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <label htmlFor="hide-results" className="text-sm">
                                Hide results until voted
                            </label>
                        </div>

                        {/* Toggle Switch using DaisyUI */}
                        <input
                            type="checkbox"
                            id="hide-results"
                            className="toggle toggle-primary"
                            checked={poll.hideResultsUntilVoted}
                            onChange={(e) => updateSettings({ hideResultsUntilVoted: e.target.checked })}
                            disabled={updating || poll.isExpired}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-border">
                    <button
                        onClick={viewStats}
                        className="btn btn-outline w-full bg-transparent flex items-center justify-center gap-2"
                    >
                        <BarChart3 className="h-4 w-4" />
                        View Analytics
                    </button>

                    {poll.votesCount >= 20 && (
                        <button
                            onClick={viewAdvancedInsights}
                            className="btn btn-outline w-full bg-transparent flex items-center justify-center gap-2"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Advanced Insights
                        </button>
                    )}

                    <button
                        onClick={deletePoll}
                        className={`btn btn-error w-full flex items-center justify-center gap-2 ${deleting ? "loading" : ""
                            }`}
                        disabled={deleting}
                    >
                        <Trash2 className="h-4 w-4" />
                        {deleting ? "Deleting..." : "Delete Poll"}
                    </button>
                </div>
            </div>
        </div>

    )
}

export default CreatorPanel
