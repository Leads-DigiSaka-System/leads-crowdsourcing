import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const recommended = !!body.recommended

    if (!recommended) {
      const updated = await prisma.project.update({
        where: { id },
        data: { recommendationRank: null },
        select: { id: true, recommendationRank: true }
      })
      return NextResponse.json(updated)
    }

    // Add to bottom rank (max + 1)
    const maxRank = await prisma.project.aggregate({
      _max: { recommendationRank: true },
      where: { recommendationRank: { not: null } }
    })
    const nextRank = (maxRank?._max?.recommendationRank || 0) + 1
    const updated = await prisma.project.update({
      where: { id },
      data: { recommendationRank: nextRank },
      select: { id: true, recommendationRank: true }
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating recommendation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
