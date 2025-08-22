import { createCanvas } from "canvas"
import { prisma } from "../index.js"

const graphMetaTag = async (req, res) => {
    try {
        const { id } = req.params

        const poll = await prisma.poll.findUnique({
            where: { id },
            include: {
                options: {
                    orderBy: { order: "asc" },
                },
            },
        })

        if (!poll) {
            return res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Poll Not Found</title>
            <meta property="og:title" content="Poll Not Found" />
            <meta property="og:description" content="This poll doesn't exist or has been removed." />
            <meta property="og:type" content="website" />
          </head>
          <body>
            <h1>Poll Not Found</h1>
          </body>
          </html>
        `)
        }

        const optionsList = poll.options.map((opt) => opt.text).join(" • ")
        const description = `Vote now: ${optionsList}`
        const pollUrl = `${req.protocol}://${req.get("host")}/poll/${id}`
        const imageUrl = `${req.protocol}://${req.get("host")}/og/poll/${id}/image.png`

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${poll.question}</title>
          <meta property="og:title" content="${poll.question}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="${pollUrl}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:site_name" content="QuickPoll" />
          
          <!-- Twitter Card -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${poll.question}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${imageUrl}" />
          
          <!-- WhatsApp specific -->
          <meta property="og:image:alt" content="Poll: ${poll.question}" />
          
          <!-- Redirect to actual poll -->
          <meta http-equiv="refresh" content="0; url=${pollUrl}" />
          <link rel="canonical" href="${pollUrl}" />
        </head>
        <body>
          <h1>${poll.question}</h1>
          <p>Redirecting to poll...</p>
          <a href="${pollUrl}">Click here if you're not redirected automatically</a>
        </body>
        </html>
      `

        res.setHeader("Content-Type", "text/html")
        res.send(html)
    } catch (error) {
        console.error("Error serving OG tags:", error)
        res.status(500).send("Error loading poll preview")
    }
}

const dynamicGraphImage = async (req, res) => {
    try {
        const { id } = req.params

        const poll = await prisma.poll.findUnique({
            where: { id },
            include: {
                options: {
                    orderBy: { order: "asc" },
                },
            },
        })

        if (!poll) {
            return res.status(404).send("Poll not found")
        }

        // Create canvas
        const width = 1200
        const height = 630
        const canvas = createCanvas(width, height)
        const ctx = canvas.getContext("2d")

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, "#ffffff")
        gradient.addColorStop(1, "#fffbeb")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        // Brand colors
        const primaryColor = "#ea580c"
        const secondaryColor = "#f97316"
        const textColor = "#4b5563"
        const mutedColor = "#9ca3af"

        // Add subtle pattern/texture
        ctx.fillStyle = "#f3f4f6"
        ctx.globalAlpha = 0.3
        for (let i = 0; i < width; i += 40) {
            for (let j = 0; j < height; j += 40) {
                if ((i + j) % 80 === 0) {
                    ctx.fillRect(i, j, 2, 2)
                }
            }
        }
        ctx.globalAlpha = 1

        // Logo/Brand area
        ctx.fillStyle = primaryColor
        ctx.fillRect(60, 60, 6, 60)

        ctx.fillStyle = textColor
        ctx.font = "bold 32px Arial, sans-serif"
        ctx.fillText("QuickPoll", 90, 100)

        // Poll question
        ctx.fillStyle = textColor
        ctx.font = "bold 48px Arial, sans-serif"

        // Word wrap for long questions
        const maxWidth = width - 120
        const words = poll.question.split(" ")
        let line = ""
        let y = 200
        const lineHeight = 60

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " "
            const metrics = ctx.measureText(testLine)
            const testWidth = metrics.width

            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, 60, y)
                line = words[n] + " "
                y += lineHeight
            } else {
                line = testLine
            }
        }
        ctx.fillText(line, 60, y)

        // Options
        const optionsStartY = y + 80
        ctx.font = "28px Arial, sans-serif"
        ctx.fillStyle = mutedColor

        poll.options.slice(0, 4).forEach((option, index) => {
            const optionY = optionsStartY + index * 45

            // Option bullet
            ctx.fillStyle = index === 0 ? primaryColor : secondaryColor
            ctx.beginPath()
            ctx.arc(80, optionY - 8, 8, 0, 2 * Math.PI)
            ctx.fill()

            // Option text
            ctx.fillStyle = textColor
            const optionText = option.text.length > 50 ? option.text.substring(0, 47) + "..." : option.text
            ctx.fillText(optionText, 110, optionY)
        })

        // Vote count and stats
        if (poll.votesCount > 0) {
            ctx.fillStyle = mutedColor
            ctx.font = "24px Arial, sans-serif"
            ctx.fillText(`${poll.votesCount} votes`, width - 200, height - 60)
        }

        // Call to action
        ctx.fillStyle = primaryColor
        ctx.font = "bold 28px Arial, sans-serif"
        ctx.fillText("Vote now →", width - 200, height - 100)

        // Border
        ctx.strokeStyle = "#e5e7eb"
        ctx.lineWidth = 2
        ctx.strokeRect(1, 1, width - 2, height - 2)

        // Send image
        res.setHeader("Content-Type", "image/png")
        res.setHeader("Cache-Control", "public, max-age=3600") // Cache for 1 hour
        res.setHeader("Access-Control-Allow-Origin", "*")
        res.setHeader("Access-Control-Allow-Methods", "GET")
        res.setHeader("Access-Control-Allow-Headers", "Content-Type")

        const buffer = canvas.toBuffer("image/png")
        res.send(buffer)
    } catch (error) {
        console.error("Error generating OG image:", error)
        res.status(500).send("Error generating image")
    }
}


const serveFavicon = (req, res) => {
    // Simple SVG favicon converted to ICO format
    const faviconSvg = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="#ea580c" rx="6"/>
        <path d="M8 12h16v2H8zm0 4h12v2H8zm0 4h16v2H8z" fill="white"/>
        <circle cx="24" cy="8" r="3" fill="white"/>
      </svg>
    `

    res.setHeader("Content-Type", "image/svg+xml")
    res.send(faviconSvg)
}

export { graphMetaTag, dynamicGraphImage, serveFavicon }
