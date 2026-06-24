import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || 'all'

    const where = {
      archived: false,
      show: true,
      recommendationRank: { not: null },
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { authors: { contains: search, mode: 'insensitive' } },
        { overview: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (categoryId !== 'all') where.categoryId = categoryId

    const projects = await prisma.project.findMany({
      where,
      orderBy: { recommendationRank: 'asc' },
      select: {
        id: true,
        title: true,
        authors: true,
        recommendationRank: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching recommended list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  // Reorder: { orderedIds: string[] }
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : []
    if (orderedIds.length === 0) {
      // Clear all recommended ranks
      await prisma.project.updateMany({ where: { recommendationRank: { not: null } }, data: { recommendationRank: null } })
      return NextResponse.json({ ok: true, cleared: true })
    }
    // Two-phase update to avoid unique conflicts:
    // 1) Set all involved items to null
    // 2) Assign ranks 1..N
    await prisma.$transaction([
      prisma.project.updateMany({ where: { id: { in: orderedIds } }, data: { recommendationRank: null } }),
      ...orderedIds.map((id, idx) => prisma.project.update({ where: { id }, data: { recommendationRank: idx + 1 } }))
    ])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error reordering recommended:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
