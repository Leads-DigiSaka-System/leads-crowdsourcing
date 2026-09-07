import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma'


export async function POST(request, { params }) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { id } = await params;
    const { meetingLink, scheduledDate } = await request.json();

    // Validate required fields
    if (!meetingLink || !scheduledDate) {
      return NextResponse.json(
        { error: 'Meeting link and scheduled date are required' },
        { status: 400 }
      );
    }

    // Validate URL format for meeting link
    try {
      new URL(meetingLink);
    } catch {
      return NextResponse.json(
        { error: 'Invalid meeting link URL format' },
        { status: 400 }
      );
    }

    // Validate date is in the future
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled date must be in the future' },
        { status: 400 }
      );
    }

    // Check if meeting request exists
    const existingRequest = await prisma.meetingRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true } }
      }
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Meeting request not found' }, { status: 404 });
    }

    // Update meeting request with scheduling details
    const updatedRequest = await prisma.meetingRequest.update({
      where: { id },
      data: {
        status: 'SCHEDULED',
        meetingLink,
        scheduledDate: scheduledDateTime,
        updatedAt: new Date()
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, title: true, authors: true } },
        messages: {
          include: {
            sender: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Create a system message to notify about the scheduling
    await prisma.message.create({
      data: {
        meetingRequestId: id,
        senderId: session.user.id,
        content: `Meeting scheduled for ${scheduledDateTime.toLocaleString()}. Meeting link: ${meetingLink}`,
        isAdminMessage: true
      }
    });

    return NextResponse.json({
      message: 'Meeting scheduled successfully',
      meetingRequest: updatedRequest
    });

  } catch (error) {
    console.error('Error scheduling meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}