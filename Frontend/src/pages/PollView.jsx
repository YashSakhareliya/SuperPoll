import React from 'react'
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Clock, Users, TrendingUp } from "lucide-react"
import { useToast } from '../hooks/use-toast'

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
  
  
  return (
    <div>
      Poll view
    </div>
  )
}

export default PollView
