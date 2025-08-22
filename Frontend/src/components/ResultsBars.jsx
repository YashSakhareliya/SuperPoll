import React from 'react'
import { CheckCircle } from 'lucide-react'

const ResultsBars = ({ poll, userChoice, showAnimation = false }) => {
  const maxVotes = Math.max(...poll.options.map(opt => opt.votesCount))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Poll Results</h3>
        <div className="text-sm text-muted-foreground">
          {poll.votesCount} total votes
        </div>
      </div>

      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = poll.votesCount > 0 ? (option.votesCount / poll.votesCount) * 100 : 0
          const isUserChoice = userChoice && userChoice.id === option.id
          const isLeading = option.votesCount === maxVotes && maxVotes > 0

          return (
            <div
              key={option.id}
              className={`relative p-4 rounded-lg border transition-all duration-300 ${
                isUserChoice
                  ? 'border-primary bg-primary/5'
                  : isLeading
                  ? 'border-secondary bg-secondary/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{option.text}</span>
                  {isUserChoice && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                  {isLeading && !isUserChoice && (
                    <div className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full">
                      Leading
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {option.votesCount} votes
                  </span>
                  <span className="font-semibold text-foreground">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-out ${
                    isUserChoice
                      ? 'bg-primary'
                      : isLeading
                      ? 'bg-secondary'
                      : 'bg-accent'
                  } ${showAnimation ? 'animate-pulse' : ''}`}
                  style={{
                    width: `${percentage}%`,
                    transition: showAnimation ? 'width 1s ease-out' : 'width 0.3s ease-out'
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {poll.insight && (
        <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-accent mb-1">Poll Insight</h4>
              <p className="text-sm text-muted-foreground">{poll.insight}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResultsBars
