import { prisma } from "@/lib/prisma"

export function generateNumericCode(length = 6) {
  const digits = "0123456789"
  let code = ""
  for (let i = 0; i < length; i++) code += digits[Math.floor(Math.random() * 10)]
  return code
}

export function generateOpaqueToken(bytes = 32) {
  // Use Web Crypto API (Edge Runtime compatible)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(bytes)
    crypto.getRandomValues(buffer)
    // Convert to base64url
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }
  // Fallback for Node.js environments (won't run in Edge but needed for type checking)
  const { randomBytes } = require("crypto")
  return randomBytes(bytes).toString("base64url")
}

export async function createOrReplaceVerificationCode(email, ttlMs = 1000 * 60 * 60 * 2) {
  const code = generateNumericCode(6)
  const expiresAt = new Date(Date.now() + ttlMs)
  // Clean old codes for this email and insert a fresh one
  await prisma.emailVerificationCode.deleteMany({ where: { email } })
  await prisma.emailVerificationCode.create({ data: { email, code, expiresAt } })
  return { code, expiresAt }
}

export async function getActiveVerificationCode(email) {
  const now = new Date()
  const rec = await prisma.emailVerificationCode.findFirst({
    where: { email, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  })
  return rec
}

export async function createVerificationSession(email, ttlMs = 1000 * 60 * 60 * 2) {
  const token = generateOpaqueToken()
  const expiresAt = new Date(Date.now() + ttlMs)
  await prisma.emailVerificationSession.deleteMany({ where: { email } })
  await prisma.emailVerificationSession.create({ data: { token, email, expiresAt } })
  return { token, expiresAt }
}

export async function getSessionByToken(token) {
  const now = new Date()
  const session = await prisma.emailVerificationSession.findUnique({ where: { token } })
  if (!session) return null
  if (session.expiresAt <= now) return null
  return session
}

export async function deleteSession(token) {
  await prisma.emailVerificationSession.delete({ where: { token } }).catch(() => { })
}

export function maskEmail(email) {
  const [local, domain] = String(email).split("@")
  if (!domain) return email
  const maskedLocal = local.length <= 2 ? local[0] + "*" : local[0] + "*".repeat(Math.max(1, local.length - 2)) + local.at(-1)
  return `${maskedLocal}@${domain}`
}

export async function createOneTimeLoginToken(email, ttlMs = 1000 * 60 * 15) {
  const token = generateOpaqueToken(32)
  const expiresAt = new Date(Date.now() + ttlMs)
  // Clean old tokens for this email
  await prisma.oneTimeLoginToken.deleteMany({ where: { email } })
  await prisma.oneTimeLoginToken.create({ data: { token, email, expiresAt } })
  return { token, expiresAt }
}

export async function getLoginTokenByToken(token) {
  const now = new Date()
  const loginToken = await prisma.oneTimeLoginToken.findUnique({ where: { token } })
  if (!loginToken) return null
  if (loginToken.expiresAt <= now) {
    await prisma.oneTimeLoginToken.delete({ where: { token } }).catch(() => { })
    return null
  }
  return loginToken
}

export async function deleteLoginToken(token) {
  await prisma.oneTimeLoginToken.delete({ where: { token } }).catch(() => { })
}
