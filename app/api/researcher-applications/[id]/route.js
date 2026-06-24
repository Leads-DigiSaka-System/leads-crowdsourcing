import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {prisma} from "@/lib/prisma"

// GET - Fetch single application
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

    // Only allow owner or admin to view
    if (application.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({ success: true, application })
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch application" },
      { status: 500 }
    )
  }
}

// PUT - Update application (only if PENDING or REVISION_PENDING)
export async function PUT(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existingApplication = await prisma.researcherApplication.findUnique({
      where: { id },
      select: { userId: true, status: true },
    })

    if (!existingApplication) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    // Only owner can update
    if (existingApplication.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Can only edit if PENDING or REVISION_PENDING
    if (!["PENDING", "REVISION_PENDING"].includes(existingApplication.status)) {
      return NextResponse.json(
        { success: false, message: "Cannot edit approved or rejected applications" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      title,
      authors,
      image,
      imageAlt,
      currency,
      daysLeft,
      tags,
      categoryId,
      location,
      overview,
      methods,
      labNotes,
      discussion,
      contextAnswer,
      significanceAnswer,
      goalsAnswer,
      teamDescription,
      budgetDescription,
      timelineDescription,
      timelineDurationMonths,
      teamMembers,
      budgetItems,
      timelineEvents,
    } = body

    const application = await prisma.researcherApplication.update({
      where: { id },
      data: {
        title,
        authors,
        image,
        imageAlt,
        currency,
        daysLeft: daysLeft ? parseInt(daysLeft) : undefined,
        tags: tags || [],
        categoryId,
        location,
        overview,
        methods,
        labNotes,
        discussion,
        contextAnswer,
        significanceAnswer,
        goalsAnswer,
        teamDescription,
        budgetDescription,
        timelineDescription,
        timelineDurationMonths: timelineDurationMonths ? parseInt(timelineDurationMonths) : null,
        teamMembers: teamMembers || [],
        budgetItems: budgetItems || [],
        timelineEvents: timelineEvents || [],
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Application updated successfully",
      application,
    })
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update application" },
      { status: 500 }
    )
  }
}

// DELETE - Delete application (only if PENDING or REVISION_PENDING)
export async function DELETE(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existingApplication = await prisma.researcherApplication.findUnique({
      where: { id },
      select: { userId: true, status: true },
    })

    if (!existingApplication) {
      return NextResponse.json({ success: false, message: "Application not found" }, { status: 404 })
    }

    // Only owner can delete
    if (existingApplication.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }

    // Can only delete if PENDING or REVISION_PENDING
    if (!["PENDING", "REVISION_PENDING"].includes(existingApplication.status)) {
      return NextResponse.json(
        { success: false, message: "Cannot delete approved or rejected applications" },
        { status: 400 }
      )
    }

    await prisma.researcherApplication.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete application" },
      { status: 500 }
    )
  }
}
