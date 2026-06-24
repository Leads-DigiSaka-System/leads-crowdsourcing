import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createOrReplaceVerificationCode, createVerificationSession, getActiveVerificationCode, getSessionByToken, maskEmail } from "@/lib/verification"
import { sendVerificationCodeEmail } from "@/lib/email"

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email, verifyToken, identifier } = body || {}

    let targetEmail = null
    if (verifyToken) {
      const session = await getSessionByToken(verifyToken)
      if (!session) return NextResponse.json({ message: "Verification session expired" }, { status: 410 })
      targetEmail = session.email
    } else if (identifier) {
      const ident = String(identifier).trim().toLowerCase()
      if (ident.includes("@")) {
        targetEmail = ident
      } else {
        const u = await prisma.user.findUnique({ where: { username: ident } })
        targetEmail = u?.email || null
      }
    } else if (email) {
      targetEmail = String(email).toLowerCase()
    }

    if (!targetEmail) return NextResponse.json({ message: "Email or token required" }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: targetEmail } })
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 })
    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" }, { status: 409 })
    }

    // If there's an active code, don't send a new email; otherwise create and send
    const active = await getActiveVerificationCode(user.email)
    let code
    let expiresAt
    if (active) {
      code = active.code
      expiresAt = active.expiresAt
    } else {
      const fresh = await createOrReplaceVerificationCode(user.email)
      code = fresh.code
      expiresAt = fresh.expiresAt
      await sendVerificationCodeEmail({ to: user.email, code, expiresMinutes: 120, maskedEmail: maskEmail(user.email) })
    }

    const { token } = await createVerificationSession(user.email)
    const masked = maskEmail(user.email)
    return NextResponse.json({ ok: true, verifyToken: token, expiresAt, maskedEmail: masked })
  } catch (err) {
    console.error("send-verification error:", err)
    return NextResponse.json({ message: "Failed to send code" }, { status: 500 })
  }
}
