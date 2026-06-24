import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request, { params }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if meeting request exists and user has access
    const meetingRequest = await prisma.meetingRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true
      }
    })

    if (!meetingRequest) {
      return NextResponse.json({ error: 'Meeting request not found' }, { status: 404 })
    }

    // Check permissions: user must own the request or be admin
    if (session.user.role !== 'admin' && meetingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: { meetingRequestId: id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()
    const { content } = data

    // Validate required fields
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Check if meeting request exists and user has access
    const meetingRequest = await prisma.meetingRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true
      }
    })

    if (!meetingRequest) {
      return NextResponse.json({ error: 'Meeting request not found' }, { status: 404 })
    }

    // Check permissions: user must own the request or be admin
    if (session.user.role !== 'admin' && meetingRequest.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        meetingRequestId: id,
        senderId: session.user.id,
        content: content.trim(),
        isAdminMessage: session.user.role === 'admin'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}