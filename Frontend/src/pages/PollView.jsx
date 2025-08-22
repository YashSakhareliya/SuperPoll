import React from 'react'
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Clock, Users, TrendingUp } from "lucide-react"
import { useToast } from '../hooks/use-toast'
import { SharePanel, CreatorPanel, InsightCard, VotingInterface } from '../components'
import { io } from "socket.io-client"

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
      const url = new URL(`/api/polls/${id}`, window.location.origin)
      if (secret) {
        url.searchParams.set("creatorSecret", secret)
      }

      // fetch poll data from backend
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch poll")
      }

      setPoll(data)
      setIsCreator(data.isCreator)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const checkVoteStatus = async () => {
    try {
      // check vote status from backend
      const response = await fetch(`/api/polls/${id}/vote-status`, {
        credentials: "include",
      })
      const data = await response.json()

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
      const response = await fetch(`/api/polls/${id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": crypto.randomUUID(),
        },
        credentials: "include",
        body: JSON.stringify({ optionId }),
      })

      const data = await response.json()

      if (response.status === 409) {
        // Already voted
        setHasVoted(true)
        setUserChoice(data.yourChoice)
        toast({
          title: "Already Voted",
          description: "You have already voted in this poll.",
        })
        return
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to vote")
      }

      setHasVoted(true)
      setUserChoice(data.yourChoice)
      toast({
        title: "Vote Recorded",
        description: "Your vote has been recorded successfully!",
      })
    } catch (error) {
      toast({
        title: "Error Voting",
        description: error.message,
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
  
  return (
    <div>
      Poll view
    </div>
  )
}

export default PollView
