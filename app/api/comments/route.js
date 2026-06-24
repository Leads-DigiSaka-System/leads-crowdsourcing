import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get top-level comments (no parent) with only one level of replies (YouTube-style)
    const comments = await prisma.comment.findMany({
      where: {
        projectId: projectId,
        parentId: null,
        isHidden: false
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true }
        },
        replies: {
          where: { isHidden: false },
          include: {
            user: {
              select: { id: true, name: true, username: true, image: true }
            },
            _count: { select: { upvoters: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { upvoters: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    // Get total count for pagination
    const totalComments = await prisma.comment.count({
      where: {
        projectId: projectId,
        parentId: null,
        isHidden: false
      }
    })

    const totalPages = Math.ceil(totalComments / limit)

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        totalComments,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { projectId, content, parentId, isAnonymous } = await request.json()

    if (!projectId || !content?.trim()) {
      return NextResponse.json({ error: 'Project ID and content are required' }, { status: 400 })
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // If this is a reply, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, projectId: true }
      })

      if (!parentComment || parentComment.projectId !== projectId) {
        return NextResponse.json({ error: 'Parent comment not found or not in the same project' }, { status: 404 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        projectId,
        userId: session.user.id,
        parentId: parentId || null,
        content: content.trim(),
        isAnonymous: Boolean(isAnonymous)
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, image: true }
        },
        _count: { select: { upvoters: true } }
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}