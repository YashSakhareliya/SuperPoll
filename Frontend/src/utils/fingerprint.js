/**
 * Device Fingerprinting Utility
 * Collects browser and device information for enhanced voting security
 */

export const generateDeviceFingerprint = () => {
  try {
    const fingerprint = {
      // Screen information
      screenResolution: `${screen.width}x${screen.height}`,
      screenColorDepth: screen.colorDepth || '',
      screenPixelDepth: screen.pixelDepth || '',
      
      // Browser information
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      language: navigator.language || '',
      languages: navigator.languages ? navigator.languages.join(',') : '',
      platform: navigator.platform || '',
      userAgent: navigator.userAgent || '',
      
      // Browser capabilities
      cookieEnabled: navigator.cookieEnabled ? 'true' : 'false',
      doNotTrack: navigator.doNotTrack || '',
      onLine: navigator.onLine ? 'true' : 'false',
      
      // Hardware information
      hardwareConcurrency: navigator.hardwareConcurrency || '',
      deviceMemory: navigator.deviceMemory || '',
      
      // Additional browser features
      webdriver: navigator.webdriver ? 'true' : 'false',
      pdfViewerEnabled: navigator.pdfViewerEnabled ? 'true' : 'false',
      
      // Canvas fingerprinting (lightweight)
      canvasFingerprint: getCanvasFingerprint(),
      
      // WebGL information
      webglFingerprint: getWebGLFingerprint(),
      
      // Timestamp for freshness
      timestamp: Date.now()
    }

    return fingerprint
  } catch (error) {
    console.warn('Error generating device fingerprint:', error)
    // Return minimal fingerprint on error
    return {
      screenResolution: `${screen.width || 0}x${screen.height || 0}`,
      timezone: '',
      language: navigator.language || '',
      platform: navigator.platform || '',
      cookieEnabled: navigator.cookieEnabled ? 'true' : 'false',
      timestamp: Date.now()
    }
  }
}

/**
 * Generate a lightweight canvas fingerprint
 */
const getCanvasFingerprint = () => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    // Set canvas size
    canvas.width = 200
    canvas.height = 50
    
    // Draw some text and shapes
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('SuperPoll 🗳️', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillText('Device ID', 4, 35)
    
    // Convert to data URL and hash it
    const dataURL = canvas.toDataURL()
    return btoa(dataURL.slice(-50)) // Take last 50 chars and encode
  } catch (error) {
    return ''
  }
}

/**
 * Generate WebGL fingerprint
 */
const getWebGLFingerprint = () => {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    
    if (!gl) return ''
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    if (!debugInfo) return ''
    
    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || ''
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
    
    return btoa(`${vendor}:${renderer}`.slice(0, 50))
  } catch (error) {
    return ''
  }
}

/**
 * Get a stable device ID (cached in localStorage)
 */
export const getDeviceId = () => {
  const DEVICE_ID_KEY = 'superpoll_device_id'
  
  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    
    if (!deviceId) {
      // Generate new device ID
      deviceId = generateRandomId()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    
    return deviceId
  } catch (error) {
    // Fallback if localStorage is not available
    return generateRandomId()
  }
}

/**
 * Generate a random device ID
 */
const generateRandomId = () => {
  return 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

/**
 * Enhanced fingerprint with device ID
 */
export const getEnhancedFingerprint = () => {
  const fingerprint = generateDeviceFingerprint()
  const deviceId = getDeviceId()
  
  return {
    ...fingerprint,
    deviceId
  }
}
