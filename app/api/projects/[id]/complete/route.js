import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH /api/projects/[id]/complete  { isCompleted: boolean }
export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    if (typeof body.isCompleted !== 'boolean') {
      return NextResponse.json({ error: 'isCompleted boolean required' }, { status: 400 })
    }
    const updated = await prisma.project.update({
      where: { id },
      data: { isCompleted: body.isCompleted },
      select: { id: true, isCompleted: true }
    })
    return NextResponse.json(updated)
  } catch (error) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }
    console.error('Error updating isCompleted:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
