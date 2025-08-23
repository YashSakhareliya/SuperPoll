import axios from 'axios'
import { getEnhancedFingerprint } from './fingerprint.js'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth headers or other common headers
api.interceptors.request.use(
  (config) => {
    // Add any common headers here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access')
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      console.error('Rate limit exceeded')
    }
    return Promise.reject(error)
  }
)

// API methods matching server routes
export const pollsAPI = {
  // POST /api/polls - Create new poll
  createPoll: (pollData) => api.post('/api/polls', pollData),
  
  // GET /api/polls/:id - Get poll details
  getPoll: (id, creatorSecret = null) => {
    const params = creatorSecret ? { creatorSecret } : {}
    return api.get(`/api/polls/${id}`, { params })
  },
  
  // PUT /api/polls/:id/settings - Update poll settings
  updatePollSettings: (id, settings) => api.put(`/api/polls/${id}/settings`, settings),
  
  // DELETE /api/polls/:id - Delete poll
  deletePoll: (id, creatorSecret) => api.delete(`/api/polls/${id}`, { 
    data: { creatorSecret } 
  }),
  
  // GET /api/polls/:id/stats - Get poll stats
  getPollStats: (id, creatorSecret) => api.get(`/api/polls/${id}/stats`, {
    params: { creatorSecret }
  }),
  
  // GET /api/polls/:id/insights - Get poll insights
  getPollInsights: (id, creatorSecret) => api.get(`/api/polls/${id}/insights`, {
    params: { creatorSecret }
  }),
  
  // GET /api/polls/:id/qr - Get poll QR code
  getPollQR: (id) => api.get(`/api/polls/${id}/qr`),
}

export const votingAPI = {
  // POST /api/polls/:id - Cast a vote with device fingerprint
  castVote: async (id, voteData, idempotencyKey) => {
    const fingerprint = getEnhancedFingerprint()
    
    return api.post(`/api/polls/${id}`, {
      ...voteData,
      fingerprint
    }, {
      headers: {
        'Idempotency-Key': idempotencyKey
      }
    })
  },
  
  // GET /api/polls/:id/vote-status - Check vote status with device fingerprint
  getVoteStatus: async (id) => {
    const fingerprint = getEnhancedFingerprint()
    
    // Send fingerprint in request body for POST-like behavior
    return api.post(`/api/polls/${id}/vote-status`, {
      fingerprint
    })
  }
}

export const ogAPI = {
  // GET /og/poll/:id - Get OG meta tags
  getOGMeta: (id) => api.get(`/og/poll/${id}`),
  
  // GET /og/poll/:id/image.png - Get OG image
  getOGImage: (id) => api.get(`/og/poll/${id}/image.png`),
  
  // GET /og/favicon.ico - Get favicon
  getFavicon: () => api.get('/og/favicon.ico')
}

export default api
