import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(request, { params }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update meeting request status
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const data = await request.json()
    const { status } = data

    // Validate status
    const validStatuses = ['PENDING', 'READ', 'SCHEDULED', 'COMPLETED', 'REJECTED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if meeting request exists
    const existingRequest = await prisma.meetingRequest.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Meeting request not found' }, { status: 404 })
    }

    // Update the meeting request
    const updatedRequest = await prisma.meetingRequest.update({
      where: { id },
      data: { status },
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

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error('Error updating meeting request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}