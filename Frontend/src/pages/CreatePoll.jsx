import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Minus, Wand2, Clock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { useToast } from "../hooks/use-toast"
import { pollsAPI } from "../utils/api"

const CreatePoll = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [useQuickCreate, setUseQuickCreate] = useState(false)

  const [formData, setFormData] = useState({
    question: "",
    options: ["", ""],
    expiryHours: 24,
    hideResultsUntilVoted: false,
    quickCreate: "",
  })
  console.log(formData)
  const addOption = () => {
    if (formData.options.length < 4) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, ""],
      }))
    }
  }

  const removeOption = (index) => {
    if (formData.options.length > 2) {
      setFormData((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }))
    }
  }

  const updateOption = (index, value) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    console.log("In handel submit")
    try {
      const payload = useQuickCreate
        ? {
            quickCreate: formData.quickCreate,
            expiryHours: formData.expiryHours,
            hideResultsUntilVoted: formData.hideResultsUntilVoted,
          }
        : formData

      const response = await pollsAPI.createPoll(payload)
      console.log(response)
      const data = response.data

      localStorage.setItem(`poll_${data.poll.id}_secret`, data.creatorSecret)

      toast({
        title: "Poll created successfully!",
        description: "Your poll is ready to share.",
      })

      navigate(`/poll/${data.poll.id}`)
    } catch (error) {
      toast({
        title: "Error creating poll",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center py-8 sm:py-12 lg:py-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
          <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
          Create your poll
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 leading-tight px-2">
          Build polls that
          <span className="text-primary"> matter</span>
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
          Create interactive polls in seconds with our intuitive interface. Share with your audience and watch real-time results unfold.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          {/* Quick Create Toggle */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg sm:rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Quick Create Mode
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Use format: "Question? | Option A | Option B | Option C"
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useQuickCreate}
                  onChange={(e) => setUseQuickCreate(e.target.checked)}
                />
                <div className="w-12 h-6 sm:w-14 sm:h-7 bg-gray-300 border-2 border-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-6 sm:peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-gray-300 after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all after:shadow-md peer-checked:bg-primary peer-checked:border-primary"></div>
              </label>
            </div>
          </div>

          {/* Quick Create Input */}
          {useQuickCreate ? (
            <div className="space-y-3 sm:space-y-4">
              <label htmlFor="quickCreate" className="text-base sm:text-lg font-semibold text-foreground block">
                Quick Create Input
              </label>
              <textarea
                id="quickCreate"
                className="w-full min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                placeholder="What's your favorite color? | Red | Blue | Green | Yellow"
                value={formData.quickCreate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quickCreate: e.target.value }))
                }
                required
              />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Separate your question and options with | (pipe) characters
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Question */}
              <div className="space-y-3 sm:space-y-4">
                <label htmlFor="question" className="text-base sm:text-lg font-semibold text-foreground block">
                  Poll Question
                </label>
                <input
                  id="question"
                  type="text"
                  className="w-full p-3 sm:p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                  placeholder="What's your question?"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, question: e.target.value }))
                  }
                  maxLength={120}
                  required
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {formData.question.length}/120 characters
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 sm:space-y-4">
                <label className="text-base sm:text-lg font-semibold text-foreground block">Poll Options</label>
                <div className="space-y-2 sm:space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 sm:gap-3">
                      <input
                        type="text"
                        className="flex-1 p-3 sm:p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        maxLength={100}
                        required
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          className="p-2 sm:p-3 border border-destructive text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => removeOption(index)}
                        >
                          <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formData.options.length < 4 && (
                  <button
                    type="button"
                    className="w-full p-3 sm:p-4 border border-border text-foreground rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Poll Settings */}
          <div className="border-t border-border pt-6 sm:pt-8">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6 flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Poll Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Expiry Dropdown */}
              <div className="space-y-2 sm:space-y-3">
                <label htmlFor="expiry" className="font-medium text-foreground block text-sm sm:text-base">
                  Expires In
                </label>
                <select
                  id="expiry"
                  className="w-full p-3 sm:p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground text-sm sm:text-base"
                  value={formData.expiryHours.toString()}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiryHours: parseInt(e.target.value),
                    }))
                  }
                >
                  <option value="1">1 Hour</option>
                  <option value="6">6 Hours</option>
                  <option value="24">24 Hours</option>
                  <option value="72">3 Days</option>
                  <option value="168">1 Week</option>
                </select>
              </div>

              {/* Hide Results Toggle */}
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {formData.hideResultsUntilVoted ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    )}
                    <label htmlFor="hideResults" className="font-medium text-foreground text-sm sm:text-base">
                      Hide results until voted
                    </label>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="hideResults"
                      className="sr-only peer"
                      checked={formData.hideResultsUntilVoted}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hideResultsUntilVoted: e.target.checked,
                        }))
                      }
                    />
                    <div className="w-12 h-6 sm:w-14 sm:h-7 bg-gray-300 border-2 border-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-6 sm:peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-gray-300 after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all after:shadow-md peer-checked:bg-primary peer-checked:border-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Creating Poll..." : "Create Poll"}
            {!loading && <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreatePoll
