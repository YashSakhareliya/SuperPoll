import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Minus, Wand2, Clock, Eye, EyeOff } from "lucide-react"
import { useToast } from "../hooks/use-toast"


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

    try {
      const payload = useQuickCreate
        ? {
            quickCreate: formData.quickCreate,
            expiryHours: formData.expiryHours,
            hideResultsUntilVoted: formData.hideResultsUntilVoted,
          }
        : formData

        // api call from backend
      const response = await fetch("/api/polls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create poll")
      }

      // Store creator secret in localStorage
      localStorage.setItem(`poll_${data.poll.id}_secret`, data.creatorSecret)

      toast({
        title: "Poll created successfully!",
        description: "Your poll is ready to share.",
      })

      navigate(`/poll/${data.poll.id}`)
    } catch (error) {
      toast({
        title: "Error creating poll",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="max-w-2xl mx-auto">
  <div className="mb-8">
    <h1 className="text-3xl font-bold mb-2">Create a New Poll</h1>
    <p className="text-muted-foreground">
      Build an interactive poll and share it with your audience in seconds.
    </p>
  </div>

  {/* Card */}
  <div className="card bg-base-100 shadow-md">
    <div className="card-body">
      {/* Card Header */}
      <div className="mb-4">
        <h2 className="card-title flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Poll Setup
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose between quick-create mode or manual setup for your poll.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Create Toggle */}
        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
          <div>
            <label htmlFor="quick-create" className="text-base font-medium">
              Quick Create Mode
            </label>
            <p className="text-sm text-muted-foreground">
              Use format: "Question? | Option A | Option B | Option C"
            </p>
          </div>
          <input
            type="checkbox"
            id="quick-create"
            className="toggle toggle-primary"
            checked={useQuickCreate}
            onChange={(e) => setUseQuickCreate(e.target.checked)}
          />
        </div>

        {/* Quick Create Input */}
        {useQuickCreate ? (
          <div className="space-y-2">
            <label htmlFor="quickCreate">Quick Create Input</label>
            <textarea
              id="quickCreate"
              className="textarea textarea-bordered w-full min-h-[100px]"
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
          <>
            {/* Question */}
            <div className="space-y-2">
              <label htmlFor="question">Poll Question</label>
              <input
                id="question"
                type="text"
                className="input input-bordered w-full"
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
              <label>Poll Options</label>
              {formData.options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    maxLength={100}
                    required
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-outline btn-error btn-square"
                      onClick={() => removeOption(index)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {formData.options.length < 4 && (
                <button
                  type="button"
                  className="btn btn-outline w-full"
                  onClick={addOption}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </button>
              )}
            </div>
          </>
        )}

        {/* Poll Settings */}
        <div className="space-y-4 pt-4 border-t border-base-300">
          <h3 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Poll Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expiry Dropdown */}
            <div className="space-y-2">
              <label htmlFor="expiry">Expires In</label>
              <select
                id="expiry"
                className="select select-bordered w-full"
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
            <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
              <div className="flex items-center gap-2">
                {formData.hideResultsUntilVoted ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
                <label htmlFor="hideResults" className="text-sm">
                  Hide results until voted
                </label>
              </div>
              <input
                type="checkbox"
                id="hideResults"
                className="toggle toggle-primary"
                checked={formData.hideResultsUntilVoted}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hideResultsUntilVoted: e.target.checked,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Creating Poll..." : "Create Poll"}
        </button>
      </form>
    </div>
  </div>
</div>

  )
}

export default CreatePoll
