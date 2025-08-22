// generate qr for poll sharing
import QRCode from "qrcode"

// Generate QR code for poll sharing
export async function generatePollQR(pollId, baseUrl = "http://localhost:5173") {
  try {
    const pollUrl = `${baseUrl}/poll/${pollId}`

    const qrCodeDataUrl = await QRCode.toDataURL(pollUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: "#ea580c", // Primary color
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })

    return {
      dataUrl: qrCodeDataUrl,
      url: pollUrl,
    }
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}

// Generate QR code as SVG
export async function generatePollQRSVG(pollId, baseUrl = "http://localhost:5173") {
  try {
    const pollUrl = `${baseUrl}/poll/${pollId}`

    const qrCodeSVG = await QRCode.toString(pollUrl, {
      type: "svg",
      width: 300,
      margin: 2,
      color: {
        dark: "#ea580c",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })

    return {
      svg: qrCodeSVG,
      url: pollUrl,
    }
  } catch (error) {
    console.error("Error generating QR code SVG:", error)
    throw new Error("Failed to generate QR code SVG")
  }
}
