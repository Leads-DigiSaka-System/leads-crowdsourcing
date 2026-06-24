import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Get user upvote status and backer status for a project's comments
export async function GET(request) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const commentIds = searchParams.get('commentIds')?.split(',') || []

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get user's upvote status for comments
    const upvotes = commentIds.length > 0 ? await prisma.commentUpvote.findMany({
      where: {
        commentId: { in: commentIds },
        userId: session.user.id
      },
      select: { commentId: true }
    }) : []

    const upvotedComments = upvotes.map(upvote => upvote.commentId)

    // Check if user is a backer of this project
    const isBackerResult = await prisma.pledge.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id,
        status: 'completed' // Only count successful pledges
      },
      select: { id: true }
    })

    const isBacker = Boolean(isBackerResult)

    // Get list of all backers for this project (for displaying backer badges)
    const backers = await prisma.pledge.findMany({
      where: {
        projectId: projectId,
        status: 'completed'
      },
      select: { userId: true },
      distinct: ['userId']
    })

    const backerUserIds = backers.map(backer => backer.userId)

    return NextResponse.json({
      upvotedComments,
      isBacker,
      backerUserIds
    })
  } catch (error) {
    console.error('Error fetching user comment status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}