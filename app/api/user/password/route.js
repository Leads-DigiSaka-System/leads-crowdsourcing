import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function PATCH(request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json().catch(() => ({}))
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (!user.password) {
      return NextResponse.json({ error: "Password change disabled for Google sign-in accounts" }, { status: 400 })
    }

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("PATCH /api/user/password error", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
