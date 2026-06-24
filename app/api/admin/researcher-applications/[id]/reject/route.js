import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {prisma} from "@/lib/prisma"

// POST - Reject research application (admin only)
export async function POST(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const application = await prisma.researcherApplication.findUnique({
      where: { id },
    })

    if (!application) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    if (application.status !== "PENDING" && application.status !== "REVISION_PENDING") {
      return NextResponse.json(
        { success: false, message: "Application already processed" },
        { status: 400 }
      )
    }

    await prisma.researcherApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        approvedBy: session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Application rejected successfully",
    })
  } catch (error) {
    console.error("Error rejecting application:", error)
    return NextResponse.json(
      { success: false, message: "Failed to reject application" },
      { status: 500 }
    )
  }
}
