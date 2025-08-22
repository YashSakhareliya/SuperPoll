import React from 'react'

const VotingInterface = ({ poll, onVote, showResults }) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        {/* Card Title */}
        <h2 className="card-title">Cast Your Vote</h2>

        <div className="space-y-4 mt-2">
          {poll.options.map((option) => (
            <div key={option.id} className="space-y-2">
              {/* Option Button */}
              <button
                onClick={() => onVote(option.id)}
                className="btn btn-outline w-full h-auto p-4 text-left justify-start hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{option.text}</span>
                  {showResults && poll.votesCount > 0 && (
                    <span className="text-sm opacity-75">
                      {((option.votesCount / poll.votesCount) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </button>

              {/* Progress Bar */}
              {showResults && poll.votesCount > 0 && (
                <progress
                  className="progress progress-primary h-2 w-full"
                  value={(option.votesCount / poll.votesCount) * 100}
                  max="100"
                ></progress>
              )}
            </div>
          ))}

          {/* Message if results are hidden */}
          {!showResults && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Results will be shown after you vote
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default VotingInterface
