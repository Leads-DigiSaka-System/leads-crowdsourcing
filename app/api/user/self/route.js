import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, username: true, image: true, companyLogo: true, password: true },
    })
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      image: user.image,
      companyLogo: user.companyLogo,
      hasPassword: Boolean(user.password),
    })
  } catch (e) {
    console.error("GET /api/user/self error", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
