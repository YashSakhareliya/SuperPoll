import crypto from "crypto"
import bcrypt from "bcryptjs"

const SECRET_KEY = process.env.SECRET_KEY || "fallback-secret-key"

export function generateCreatorSecret() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashToken(pollId, token) {
  return crypto.createHmac("sha256", SECRET_KEY).update(`${pollId}:${token}`).digest("hex")
}

export function hashDevice(userAgent, ip, fingerprint = {}) {
  // Enhanced device fingerprinting
  const deviceInfo = [
    userAgent,
    ip,
    fingerprint.screenResolution || '',
    fingerprint.timezone || '',
    fingerprint.language || '',
    fingerprint.platform || '',
    fingerprint.cookieEnabled || '',
    fingerprint.doNotTrack || ''
  ].join(':')
  
  return crypto.createHash("sha256").update(deviceInfo).digest("hex")
}

export function hashIP(ip) {
  return crypto.createHash("sha256").update(ip).digest("hex")
}

export function hashIPSubnet(ip) {
  // Hash only the first 3 octets for IPv4 to detect same network
  const ipParts = ip.split('.')
  if (ipParts.length === 4) {
    const subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0`
    return crypto.createHash("sha256").update(subnet).digest("hex")
  }
  return hashIP(ip)
}

export function generateVoteToken() {
  return crypto.randomBytes(16).toString("hex")
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}
