import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteSession, getSessionByToken, createOneTimeLoginToken } from "@/lib/verification"

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { verifyToken, code } = body || {}
    if (!verifyToken || !code) {
      return NextResponse.json({ message: "verifyToken and code are required" }, { status: 400 })
    }

    const session = await getSessionByToken(verifyToken)
    if (!session) {
      return NextResponse.json({ message: "Verification session expired. Please request a new code." }, { status: 410 })
    }

    const now = new Date()
    const record = await prisma.emailVerificationCode.findFirst({
      where: { email: session.email },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      await deleteSession(verifyToken)
      return NextResponse.json({ message: "No active code. Please request a new one." }, { status: 404 })
    }

    if (record.expiresAt <= now) {
      await prisma.emailVerificationCode.deleteMany({ where: { email: session.email } })
      await deleteSession(verifyToken)
      return NextResponse.json({ message: "Code expired. A new code is required." }, { status: 410 })
    }

    if (record.code !== String(code)) {
      return NextResponse.json({ message: "Invalid code" }, { status: 401 })
    }

  
    await prisma.user.update({ where: { email: session.email }, data: { emailVerified: now } })
    await prisma.emailVerificationCode.deleteMany({ where: { email: session.email } })
    await deleteSession(verifyToken)

    // Generate one-time login token for secure auto-login
    const { token: loginToken } = await createOneTimeLoginToken(session.email, 1000 * 60 * 15) // 15 minutes

    return NextResponse.json({ ok: true, email: session.email, loginToken })
  } catch (err) {
    console.error("verify-email error:", err)
    return NextResponse.json({ message: "Failed to verify" }, { status: 500 })
  }
}
