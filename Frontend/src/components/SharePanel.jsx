import React from 'react'
import { useState, useEffect } from "react"
import { Share2, Copy, QrCode, Check, ExternalLink } from "lucide-react"
import { useToast } from '../hooks/use-toast'

const SharePanel = ({ pollId, question }) => {

  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [showQR, setShowQR] = useState(false)

  const shareUrl = `${window.location.origin}/poll/${pollId}`
  const ogUrl = `${window.location.origin}/og/poll/${pollId}`

  useEffect(() => {
    // Use server-generated QR code
    setQrCodeUrl(`/api/polls/${pollId}/qr`)
  }, [pollId])

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
            onClick={() => setShowQR(!showQR)}
            className="btn btn-outline"
          >
            <QrCode className="h-4 w-4" />
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
        {showQR && (
          <div className="text-center p-4 bg-base-200 rounded-lg mt-4">
            <img
              src={qrCodeUrl || "/placeholder.svg"}
              alt="QR Code for poll"
              className="mx-auto mb-2 max-w-[200px]"
              onError={(e) => {
                e.target.src = "/qr-code-generic.png";
              }}
            />
            <p className="text-sm text-gray-500">Scan to vote</p>
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
