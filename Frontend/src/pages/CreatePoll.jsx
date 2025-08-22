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
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
          <Wand2 className="h-4 w-4" />
          Create your poll
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
          Build polls that
          <span className="text-primary"> matter</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          Create interactive polls in seconds with our intuitive interface. Share with your audience and watch real-time results unfold.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quick Create Toggle */}
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" />
                  Quick Create Mode
                </h3>
                <p className="text-muted-foreground">
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
                <div className="w-14 h-7 bg-gray-300 border-2 border-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-primary peer-checked:border-primary"></div>
              </label>
            </div>
          </div>

          {/* Quick Create Input */}
          {useQuickCreate ? (
            <div className="space-y-4">
              <label htmlFor="quickCreate" className="text-lg font-semibold text-foreground block">
                Quick Create Input
              </label>
              <textarea
                id="quickCreate"
                className="w-full min-h-[120px] p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none text-foreground placeholder:text-muted-foreground"
                placeholder="What's your favorite color? | Red | Blue | Green | Yellow"
                value={formData.quickCreate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quickCreate: e.target.value }))
                }
                required
              />
              <p className="text-sm text-muted-foreground">
                Separate your question and options with | (pipe) characters
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Question */}
              <div className="space-y-4">
                <label htmlFor="question" className="text-lg font-semibold text-foreground block">
                  Poll Question
                </label>
                <input
                  id="question"
                  type="text"
                  className="w-full p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                  placeholder="What's your question?"
                  value={formData.question}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, question: e.target.value }))
                  }
                  maxLength={120}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {formData.question.length}/120 characters
                </p>
              </div>

              {/* Options */}
              <div className="space-y-4">
                <label className="text-lg font-semibold text-foreground block">Poll Options</label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        className="flex-1 p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground placeholder:text-muted-foreground"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        maxLength={100}
                        required
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          className="p-3 border border-destructive text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={() => removeOption(index)}
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {formData.options.length < 4 && (
                  <button
                    type="button"
                    className="w-full p-4 border border-border text-foreground rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 font-medium"
                    onClick={addOption}
                  >
                    <Plus className="h-5 w-5" />
                    Add Option
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Poll Settings */}
          <div className="border-t border-border pt-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Poll Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expiry Dropdown */}
              <div className="space-y-3">
                <label htmlFor="expiry" className="font-medium text-foreground block">
                  Expires In
                </label>
                <select
                  id="expiry"
                  className="w-full p-4 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-foreground"
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
              <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {formData.hideResultsUntilVoted ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                    <label htmlFor="hideResults" className="font-medium text-foreground">
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
                    <div className="w-14 h-7 bg-gray-300 border-2 border-gray-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-2 after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-md peer-checked:bg-primary peer-checked:border-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Creating Poll..." : "Create Poll"}
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreatePoll
