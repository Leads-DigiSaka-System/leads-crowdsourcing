import { NextResponse } from "next/server"
import { auth } from "@/auth"
import {prisma} from "@/lib/prisma"

// GET - Fetch all research applications (admin only) with pagination and search
export async function GET(request) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const pageSize = parseInt(searchParams.get("pageSize") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "" // Filter by status

    const skip = (page - 1) * pageSize

    // Build where clause
    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { authors: { contains: search, mode: "insensitive" } },
          { user: { name: { contains: search, mode: "insensitive" } } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      }),
      ...(status && { status }),
    }

    const [applications, total] = await Promise.all([
      prisma.researcherApplication.findMany({
        where,
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
    console.error("Error fetching applications (admin):", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}
