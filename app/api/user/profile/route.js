import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/

export async function PATCH(request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const updates = {}

    // name
    if (typeof body.name === "string") {
      const name = body.name.trim()
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
      updates.name = name
    }

    // username
    if (typeof body.username === "string") {
      const username = body.username.trim().toLowerCase()
      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json({ error: "Invalid username. Use 3-30 chars: letters, numbers, _ . -" }, { status: 400 })
      }
      updates.username = username
    }

    // image (optional)
    if (typeof body.image === "string") {
      const image = body.image.trim()
      if (image.length > 0 && !/^https?:\/\//i.test(image)) {
        return NextResponse.json({ error: "Image must be a valid URL" }, { status: 400 })
      }
      updates.image = image || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    // If username is changing, ensure uniqueness
    if (updates.username) {
      const exists = await prisma.user.findUnique({ where: { username: updates.username } })
      if (exists && exists.id !== session.user.id) {
        return NextResponse.json({ error: "Username already taken" }, { status: 409 })
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
      select: { id: true, name: true, username: true, image: true },
    })

    return NextResponse.json({ success: true, user })
  } catch (e) {
    console.error("PATCH /api/user/profile error", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
