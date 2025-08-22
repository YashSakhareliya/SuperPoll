export function parseQuickCreate(input) {
    // Check if input contains delimiters like | or ?
    const questionMatch = input.match(/^([^?|]+)\??\s*\|\s*(.+)$/)

    if (questionMatch) {
        const question = questionMatch[1].trim()
        const optionsText = questionMatch[2]

        // Split options by | and clean them up
        const options = optionsText
            .split("|")
            .map((opt) => opt.trim())
            .filter((opt) => opt.length > 0)
            .slice(0, 4) // Max 4 options

        if (question.length <= 120 && options.length >= 2) {
            return { question, options }
        }
    }

    return null
}
