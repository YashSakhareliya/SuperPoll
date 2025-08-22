import crypto from "crypto"
import bcrypt from "bcryptjs"

const SECRET_KEY = process.env.SECRET_KEY || "fallback-secret-key"

export function generateCreatorSecret() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashToken(pollId, token) {
  return crypto.createHmac("sha256", SECRET_KEY).update(`${pollId}:${token}`).digest("hex")
}

export function hashDevice(userAgent, ip) {
  return crypto.createHash("sha256").update(`${userAgent}:${ip}`).digest("hex")
}

export function hashIP(ip) {
  return crypto.createHash("sha256").update(ip).digest("hex")
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
