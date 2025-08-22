import React from 'react'
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Clock, Users, TrendingUp } from "lucide-react"
import { useToast } from '../hooks/use-toast'
import { SharePanel, CreatorPanel, InsightCard, VotingInterface } from '../components'
import ResultsBars from '../components/ResultsBars'
import { io } from "socket.io-client"
import { pollsAPI, votingAPI } from '../utils/api'

const PollView = () => {
  const { id } = useParams()
  const { toast } = useToast()
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [socket, setSocket] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [userChoice, setUserChoice] = useState(null)
  const [viewerCount, setViewerCount] = useState(0)
  const [isCreator, setIsCreator] = useState(false)
  const [creatorSecret, setCreatorSecret] = useState(null)

  // fetch poll data
  const fetchPoll = async (secret) => {
    try {
      const response = await pollsAPI.getPoll(id, secret)
      const data = response.data

      setPoll(data)
      setIsCreator(data.isCreator)
    } catch (error) {
      setError(error.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  const checkVoteStatus = async () => {
    try {
      const response = await votingAPI.getVoteStatus(id)
      const data = response.data

      if (data.hasVoted) {
        setHasVoted(true)
        setUserChoice(data.yourChoice)
      }
    } catch (error) {
      console.error("Error checking vote status:", error)
    }
  }

  const handleVote = async (optionId) => {
    try {
      const response = await votingAPI.castVote(
        id, 
        { optionId }, 
        crypto.randomUUID()
      )
      const data = response.data

      setHasVoted(true)
      setUserChoice(data.yourChoice)
      toast({
        title: "Vote Recorded",
        description: "Your vote has been recorded successfully!",
      })
    } catch (error) {
      if (error.response?.status === 409) {
        // Already voted
        const data = error.response.data
        setHasVoted(true)
        setUserChoice(data.yourChoice)
        toast({
          title: "Already Voted",
          description: "You have already voted in this poll.",
        })
        return
      }

      toast({
        title: "Error Voting",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      })
    }
  }
  // use Effect for poll live update
  useEffect(() => {
    // first check user if Creator from localstorage
    const secret = localStorage.getItem(`poll_${id}_secret`)
    if (secret) {
      setCreatorSecret(secret)
      setIsCreator(true)
    }

    // socket connection
    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3001")
    setSocket(newSocket)

    // fetch poll data
    fetchPoll(secret)

    // Check vote status
    checkVoteStatus()

    // Join poll room
    newSocket.emit("join-poll", { pollId: id, creatorSecret: secret })

    // Listen for real-time updates
    newSocket.on("poll-data", (data) => {
      setPoll(data)
      setLoading(false)
    })

    newSocket.on("vote_update", (data) => {
      setPoll((prev) => (prev ? { ...prev, ...data } : null))
    })

    newSocket.on("viewer-joined", (data) => {
      setViewerCount(data.viewerCount)
    })

    newSocket.on("viewer-left", (data) => {
      setViewerCount(data.viewerCount)
    })

    newSocket.on("poll-settings-updated", (data) => {
      setPoll((prev) => (prev ? { ...prev, ...data } : null))
    })

    newSocket.on("poll-expired", () => {
      setPoll((prev) => (prev ? { ...prev, isExpired: true } : null))
      toast({
        title: "Poll Expired",
        description: "This poll has reached its expiry time.",
      })
    })

    newSocket.on("poll-expiring", (data) => {
      const minutes = Math.floor(data.timeLeft / (1000 * 60))
      if (minutes <= 5) {
        toast({
          title: "Poll Expiring Soon",
          description: `This poll expires in ${minutes} minutes.`,
        })
      }
    })

    newSocket.on("poll-deleted", () => {
      toast({
        title: "Poll Deleted",
        description: "This poll has been deleted by its creator.",
        variant: "destructive",
      })
      setPoll(null)
      setError("This poll has been deleted.")
    })

    newSocket.on("error", (data) => {
      toast({
        title: "Connection Error",
        description: data.message,
        variant: "destructive",
      })
    })

    return () => {
      newSocket.emit("leave-poll", id)
      newSocket.disconnect()
    }
  }, [id])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-16">
          <div className="text-6xl mb-6">😕</div>
          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
            Poll Not Found
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {error || "The poll you're looking for doesn't exist or has been removed."}
          </p>
          <button 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            onClick={() => (window.location.href = "/")}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const timeLeft = new Date(poll.expiresAt) - new Date();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
          <TrendingUp className="h-4 w-4" />
          Live Poll Results
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
          {poll.question}
        </h1>
        <div className="flex items-center justify-center gap-6 text-muted-foreground mb-8">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {poll.votesCount} votes
          </span>
          {viewerCount > 0 && (
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              {viewerCount} viewing
            </span>
          )}
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {poll.isExpired ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium">
                Expired
              </span>
            ) : (
              <span>
                {hoursLeft}h {minutesLeft}m left
              </span>
            )}
          </span>
        </div>
        
        {/* Status Badges */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {(poll.insight || poll.insightSummary) && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Insight Available
            </div>
          )}
          {isCreator && (
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Creator
            </div>
          )}
        </div>
      </div>

      {/* Insights Section */}
      {(poll.insight || poll.insightSummary) && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <InsightCard poll={poll} insightSummary={poll.insightSummary} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Poll Content */}
        <div className="lg:col-span-2 space-y-6">
          {!hasVoted && !poll.isExpired ? (
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Cast Your Vote</h2>
                <p className="text-muted-foreground">Choose your preferred option below</p>
              </div>
              <VotingInterface poll={poll} onVote={handleVote} showResults={!poll.hideResultsUntilVoted} />
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Poll Results</h2>
                <p className="text-muted-foreground">
                  {hasVoted ? "Thank you for voting! Here are the current results:" : "Results for this poll:"}
                </p>
              </div>
              <ResultsBars poll={poll} userChoice={userChoice} showAnimation={true} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Share This Poll</h3>
            <SharePanel pollId={id} question={poll.question} />
          </div>

          {isCreator && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Creator Controls</h3>
              <CreatorPanel
                poll={poll}
                creatorSecret={creatorSecret}
                onSettingsUpdate={(settings) => {
                  if (socket) {
                    socket.emit("update-poll-settings", {
                      pollId: id,
                      creatorSecret,
                      ...settings,
                    })
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PollView
