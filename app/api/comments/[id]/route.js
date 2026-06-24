import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PUT(request, { params }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const { content, isAnonymous } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Find comment and verify ownership
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true, isHidden: true }
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (existingComment.isHidden) {
      return NextResponse.json({ error: 'Comment has been hidden by admin' }, { status: 403 })
    }

    if (existingComment.userId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 })
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
        isAnonymous: Boolean(isAnonymous),
        isEdited: true,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true }
        },
        _count: { select: { upvoters: true } }
      }
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    // Find comment and verify ownership or admin rights
    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true, isHidden: true }
    })

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const isOwner = existingComment.userId === session.user.id
    const isAdmin = session.user.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 })
    }

    // For admin deletion, just hide the comment instead of deleting
    if (isAdmin && !isOwner) {
      await prisma.comment.update({
        where: { id },
        data: { isHidden: true }
      })
    } else {
      // Owner can delete their own comment completely
      await prisma.comment.delete({
        where: { id }
      })
    }

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}