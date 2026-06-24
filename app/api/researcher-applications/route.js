import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {prisma} from "@/lib/prisma"

// GET - Fetch user's research applications with pagination and search
export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""

    const skip = (page - 1) * pageSize

    // Build where clause
    const where = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { authors: { contains: search, mode: "insensitive" } },
        ],
      }),
    }

    const [applications, total] = await Promise.all([
      prisma.researcherApplication.findMany({
        where,
        include: {
          targetProject: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.researcherApplication.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      applications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching researcher applications:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}

// POST - Create new research application
export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    // Check 3-application limit for non-researchers
    if (user.role !== "researcher") {
      const applicationCount = await prisma.researcherApplication.count({
        where: { userId },
      })

      if (applicationCount >= 3) {
        return NextResponse.json(
          {
            success: false,
            message: "You have reached the maximum limit of 3 research proposals. Your application must be approved to submit more.",
          },
          { status: 403 }
        )
      }
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
      targetProjectId, // For revisions
    } = body

    // Validate required fields
    if (!title || !overview || !methods || !contextAnswer || !significanceAnswer || !goalsAnswer || !teamDescription || !budgetDescription || !timelineDescription) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Determine if this is a revision or new application
    const isRevision = !!targetProjectId
    const status = isRevision ? "REVISION_PENDING" : "PENDING"

    const application = await prisma.researcherApplication.create({
      data: {
        userId,
        status,
        title,
        authors,
        image,
        imageAlt,
        currency,
        daysLeft: parseInt(daysLeft),
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
        targetProjectId: isRevision ? targetProjectId : null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Research application submitted successfully",
      application,
    })
  } catch (error) {
    console.error("Error creating researcher application:", error)
    return NextResponse.json(
      { success: false, message: "Failed to create application" },
      { status: 500 }
    )
  }
}
