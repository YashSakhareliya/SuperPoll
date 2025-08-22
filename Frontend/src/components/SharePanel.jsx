import React from 'react'
import { useState, useEffect } from "react"
import { Share2, Copy, QrCode, Check, ExternalLink, Loader2, Download, Image } from "lucide-react"
import { useToast } from '../hooks/use-toast'
import { pollsAPI } from '../utils/api'

const SharePanel = ({ pollId, question }) => {

  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [qrCodeData, setQrCodeData] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [loadingQR, setLoadingQR] = useState(false)
  const [qrCopied, setQrCopied] = useState(false)

  const shareUrl = `${window.location.origin}/poll/${pollId}`
  const ogUrl = `${window.location.origin}/og/poll/${pollId}`

  const fetchQRCode = async () => {
    if (qrCodeData) {
      // QR code already fetched, just toggle display
      setShowQR(!showQR)
      return
    }

    setLoadingQR(true)
    try {
      const response = await pollsAPI.getPollQR(pollId)
      const data = response.data
      
      setQrCodeData({
        svg: data.svg,
        pollUrl: data.url
      })
      setShowQR(true)
      
      toast({
        title: "QR Code Generated",
        description: "QR code is ready to share!",
      })
    } catch (error) {
      toast({
        title: "Failed to generate QR code",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      })
    } finally {
      setLoadingQR(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeData?.svg) return
    
    const blob = new Blob([qrCodeData.svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `poll-${pollId}-qr.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "QR Code Downloaded",
      description: "QR code saved as SVG file",
    })
  }

  const copyQRCode = async () => {
    if (!qrCodeData?.svg) return
    
    try {
      // Create a canvas to convert SVG to PNG for clipboard
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = async () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ])
            setQrCopied(true)
            toast({
              title: "QR Code Copied",
              description: "QR code copied to clipboard",
            })
            setTimeout(() => setQrCopied(false), 2000)
          } catch (error) {
            toast({
              title: "Copy Failed",
              description: "Could not copy QR code to clipboard",
              variant: "destructive",
            })
          }
        })
      }
      
      const svgBlob = new Blob([qrCodeData.svg], { type: 'image/svg+xml' })
      const svgUrl = URL.createObjectURL(svgBlob)
      img.src = svgUrl
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy QR code to clipboard",
        variant: "destructive",
      })
    }
  }

  const shareQRCode = async () => {
    if (!qrCodeData?.svg) return
    
    if (navigator.share) {
      try {
        const svgBlob = new Blob([qrCodeData.svg], { type: 'image/svg+xml' })
        const file = new File([svgBlob], `poll-${pollId}-qr.svg`, { type: 'image/svg+xml' })
        
        await navigator.share({
          title: "Poll QR Code",
          text: `Scan this QR code to vote: ${question}`,
          files: [file]
        })
      } catch (error) {
        if (error.name !== "AbortError") {
          downloadQRCode()
        }
      }
    } else {
      downloadQRCode()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Poll link has been copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vote in this poll",
          text: question,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          copyToClipboard()
        }
      }
    } else {
      copyToClipboard()
    }
  }

  const openPreview = () => {
    window.open(ogUrl, "_blank", "width=800,height=600")
  }

  useEffect(() => {
  }, [])

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Poll
        </h2>

        {/* URL Input and Copy Button */}
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="input input-bordered w-full text-sm"
          />
          <button
            onClick={copyToClipboard}
            className="btn btn-outline btn-square"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Share, QR, and Preview Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={shareNative}
            className="btn btn-primary flex-1 flex items-center justify-center"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
          <button
            onClick={fetchQRCode}
            className="btn btn-outline"
            disabled={loadingQR}
          >
            {loadingQR ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={openPreview}
            className="btn btn-outline btn-square"
            title="Preview social sharing"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        {/* QR Code Section */}
        {showQR && qrCodeData && (
          <div className="bg-base-200 rounded-lg mt-4 ">
            {/* QR Actions Header */}
            <div className="flex items-center justify-between p-3 border-b border-base-300">
              <h4 className="font-medium text-sm">QR Code</h4>
              <div className="flex gap-1">
                <button
                  onClick={copyQRCode}
                  className="btn btn-ghost btn-xs"
                  title="Copy QR Code"
                >
                  {qrCopied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={downloadQRCode}
                  className="btn btn-ghost btn-xs"
                  title="Download QR Code"
                >
                  <Download className="h-3 w-3" />
                </button>
                <button
                  onClick={shareQRCode}
                  className="btn btn-ghost btn-xs"
                  title="Share QR Code"
                >
                  <Share2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            
            {/* QR Code Display */}
            <div className="text-center p-4">
              <div
                className="mx-auto mb-2 w-full max-w-[180px] [&>svg]:w-full [&>svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: qrCodeData.svg }}
              />
              <p className="text-sm text-gray-500">Scan to vote</p>
              <p className="text-xs text-gray-400 mt-1 break-all">{qrCodeData.pollUrl}</p>
            </div>
            
            {/* QR Actions Footer */}
            <div className="flex gap-2 p-3 border-t border-base-300">
              <button
                onClick={copyQRCode}
                className="btn btn-outline btn-sm flex-1"
              >
                {qrCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Image className="h-4 w-4 mr-1" />
                    Copy Image
                  </>
                )}
              </button>
              <button
                onClick={downloadQRCode}
                className="btn btn-outline btn-sm flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </button>
              <button
                onClick={shareQRCode}
                className="btn btn-primary btn-sm flex-1"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
            </div>
          </div>
        )}

        {/* Info Text */}
        <div className="text-xs text-gray-500 space-y-1 mt-4">
          <p>✓ Rich previews in WhatsApp, Facebook, Twitter</p>
          <p>✓ QR code for easy mobile sharing</p>
          <p>✓ Anonymous voting with duplicate protection</p>
        </div>
      </div>
    </div>
  )
}

export default SharePanel
