import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request, { params }) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    // Verify comment exists and is not hidden
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, isHidden: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.isHidden) {
      return NextResponse.json({ error: 'Comment is not available' }, { status: 403 })
    }

    // Check if user has already upvoted this comment
    const existingUpvote = await prisma.commentUpvote.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId: session.user.id
        }
      }
    })

    let upvoted = false
    let upvoteCount = 0

    if (existingUpvote) {
      // Remove upvote (toggle off)
      await prisma.commentUpvote.delete({
        where: { id: existingUpvote.id }
      })

      // Update comment upvote count
      const updatedComment = await prisma.comment.update({
        where: { id },
        data: { upvotes: { decrement: 1 } },
        select: { upvotes: true }
      })
      upvoteCount = updatedComment.upvotes
      upvoted = false
    } else {
      // Add upvote
      await prisma.commentUpvote.create({
        data: {
          commentId: id,
          userId: session.user.id
        }
      })

      // Update comment upvote count
      const updatedComment = await prisma.comment.update({
        where: { id },
        data: { upvotes: { increment: 1 } },
        select: { upvotes: true }
      })
      upvoteCount = updatedComment.upvotes
      upvoted = true
    }

    return NextResponse.json({
      upvoted,
      upvoteCount
    })
  } catch (error) {
    console.error('Error toggling upvote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}