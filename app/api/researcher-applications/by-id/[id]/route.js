import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {prisma} from "@/lib/prisma"

// GET /api/researcher-applications/by-id/[id] - Fetch application with full details for preview
export async function GET(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const application = await prisma.researcherApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        targetProject: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    // Check authorization: owner or admin
    const isOwner = application.userId === session.user.id
    const isAdmin = session.user.role === "admin"

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Error fetching application by ID:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch application" },
      { status: 500 }
    )
  }
}
