import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view all meeting requests
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const meetingRequests = await prisma.meetingRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            authors: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: [
        { status: 'asc' }, // Pending first
        { createdAt: 'desc' } // Then by newest
      ]
    })

    return NextResponse.json({ meetingRequests })
  } catch (error) {
    console.error('Error fetching meeting requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prevent admins from creating meeting requests
    if (session.user.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot create meeting requests' }, { status: 403 })
    }

    const data = await request.json()
    const { projectId, preferredDate, preferredTime, reason } = data

    // Validate required fields
    if (!projectId || !preferredDate || !preferredTime || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, preferredDate, preferredTime, reason' },
        { status: 400 }
      )
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Create meeting request
    const meetingRequest = await prisma.meetingRequest.create({
      data: {
        userId: session.user.id,
        projectId,
        preferredDate,
        preferredTime,
        reason: reason.trim(),
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            username: true
          }
        },
        project: {
          select: {
            title: true,
            authors: true
          }
        }
      }
    })

    return NextResponse.json(meetingRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating meeting request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}