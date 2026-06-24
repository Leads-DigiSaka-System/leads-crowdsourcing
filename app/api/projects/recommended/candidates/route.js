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
      recommendationRank: null,
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
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        authors: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
      },
      take: 50,
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching candidate projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
