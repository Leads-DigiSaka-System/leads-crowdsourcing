import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {prisma} from "@/lib/prisma"

// POST - Approve research application (admin only)
export async function POST(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const application = await prisma.researcherApplication.findUnique({
      where: { id },
      include: {
        user: true,
        targetProject: true,
      },
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

    const isRevision = !!application.targetProjectId

    if (isRevision) {
      // Handle revision approval - update existing project
      await prisma.$transaction(async (tx) => {
        // Update the target project with new data
        await tx.project.update({
          where: { id: application.targetProjectId },
          data: {
            title: application.title,
            authors: application.authors,
            image: application.image,
            imageAlt: application.imageAlt,
            currency: application.currency,
            daysLeft: application.daysLeft,
            tags: application.tags,
            categoryId: application.categoryId,
            location: application.location,
            overview: application.overview,
            methods: application.methods,
            labNotes: application.labNotes,
            discussion: application.discussion,
            contextAnswer: application.contextAnswer,
            significanceAnswer: application.significanceAnswer,
            goalsAnswer: application.goalsAnswer,
            teamDescription: application.teamDescription,
            budgetDescription: application.budgetDescription,
            timelineDescription: application.timelineDescription,
            timelineDurationMonths: application.timelineDurationMonths,
            updatedAt: new Date(),
          },
        })

        // Delete old team members and create new ones
        await tx.teamMember.deleteMany({
          where: { projectId: application.targetProjectId },
        })

        if (application.teamMembers && Array.isArray(application.teamMembers) && application.teamMembers.length > 0) {
          await tx.teamMember.createMany({
            data: application.teamMembers.map((member) => ({
              projectId: application.targetProjectId,
              name: member.name || null,
              role: member.role,
              responsibility: member.responsibility || null,
              bio: member.bio || "",
              image: member.image || null,
              imageAlt: member.imageAlt || null,
              email: member.email || null,
              linkedin: member.linkedin || null,
              twitter: member.twitter || null,
              expertise: member.expertise || [],
            })),
          })
        }

        // Delete old budget items and create new ones
        await tx.budgetItem.deleteMany({
          where: { projectId: application.targetProjectId },
        })

        if (application.budgetItems && Array.isArray(application.budgetItems) && application.budgetItems.length > 0) {
          await tx.budgetItem.createMany({
            data: application.budgetItems.map((item, index) => ({
              projectId: application.targetProjectId,
              name: item.name,
              description: item.description || null,
              value: parseInt(item.value),
              position: index,
            })),
          })
        }

        // Delete old timeline events and create new ones
        await tx.timelineEvent.deleteMany({
          where: { projectId: application.targetProjectId },
        })

        if (application.timelineEvents && Array.isArray(application.timelineEvents) && application.timelineEvents.length > 0) {
          await tx.timelineEvent.createMany({
            data: application.timelineEvents.map((event) => ({
              projectId: application.targetProjectId,
              date: event.date,
              title: event.title,
            })),
          })
        }

        // Update application status
        await tx.researcherApplication.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: session.user.id,
          },
        })
      })

      return NextResponse.json({
        success: true,
        message: "Revision approved and project updated successfully",
      })
    } else {
      // Handle new application approval - create new project and promote user
      const result = await prisma.$transaction(async (tx) => {
        // Generate slug from title
        const baseSlug = application.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")

        let slug = baseSlug
        let counter = 1

        // Ensure unique slug
        while (await tx.project.findUnique({ where: { slug } })) {
          slug = `${baseSlug}-${counter}`
          counter++
        }

        // Calculate goal from budget items
        const budgetItems = application.budgetItems || []
        const goal = Array.isArray(budgetItems)
          ? budgetItems.reduce((sum, item) => sum + parseInt(item.value || 0), 0)
          : 0

        // Create project
        const project = await tx.project.create({
          data: {
            addedBy: application.userId,
            title: application.title,
            authors: application.authors,
            image: application.image,
            imageAlt: application.imageAlt,
            currency: application.currency,
            daysLeft: application.daysLeft,
            tags: application.tags,
            categoryId: application.categoryId,
            location: application.location,
            overview: application.overview,
            methods: application.methods,
            labNotes: application.labNotes,
            discussion: application.discussion,
            contextAnswer: application.contextAnswer,
            significanceAnswer: application.significanceAnswer,
            goalsAnswer: application.goalsAnswer,
            teamDescription: application.teamDescription,
            budgetDescription: application.budgetDescription,
            timelineDescription: application.timelineDescription,
            timelineDurationMonths: application.timelineDurationMonths,
            goal,
            slug,
            fromApplication: true,
          },
        })

        // Create team members
        if (application.teamMembers && Array.isArray(application.teamMembers) && application.teamMembers.length > 0) {
          await tx.teamMember.createMany({
            data: application.teamMembers.map((member) => ({
              projectId: project.id,
              name: member.name || null,
              role: member.role,
              responsibility: member.responsibility || null,
              bio: member.bio || "",
              image: member.image || null,
              imageAlt: member.imageAlt || null,
              email: member.email || null,
              linkedin: member.linkedin || null,
              twitter: member.twitter || null,
              expertise: member.expertise || [],
            })),
          })
        }

        // Create budget items
        if (application.budgetItems && Array.isArray(application.budgetItems) && application.budgetItems.length > 0) {
          await tx.budgetItem.createMany({
            data: application.budgetItems.map((item, index) => ({
              projectId: project.id,
              name: item.name,
              description: item.description || null,
              value: parseInt(item.value),
              position: index,
            })),
          })
        }

        // Create timeline events
        if (application.timelineEvents && Array.isArray(application.timelineEvents) && application.timelineEvents.length > 0) {
          await tx.timelineEvent.createMany({
            data: application.timelineEvents.map((event) => ({
              projectId: project.id,
              date: event.date,
              title: event.title,
            })),
          })
        }

        // Update user role to researcher
        await tx.user.update({
          where: { id: application.userId },
          data: { role: "researcher" },
        })

        // Update application status and link to created project
        await tx.researcherApplication.update({
          where: { id },
          data: {
            status: "APPROVED",
            approvedAt: new Date(),
            approvedBy: session.user.id,
            createdProjectId: project.id,
          },
        })

        return project
      })

      return NextResponse.json({
        success: true,
        message: "Application approved, project created, and user promoted to researcher",
        project: result,
      })
    }
  } catch (error) {
    console.error("Error approving application:", error)
    return NextResponse.json(
      { success: false, message: "Failed to approve application" },
      { status: 500 }
    )
  }
}
