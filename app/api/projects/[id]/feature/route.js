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
    const nextValue = !!body.featured

    // If setting to true, enforce max of 5 featured
    if (nextValue) {
      const count = await prisma.project.count({ where: { featuredHero: true, NOT: { id } } })
      const current = await prisma.project.findUnique({ where: { id }, select: { featuredHero: true } })
      const already = !!current?.featuredHero
      if (!already && count >= 5) {
        return NextResponse.json({ error: 'You can only feature up to 5 projects.' }, { status: 400 })
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { featuredHero: nextValue },
      select: { id: true, featuredHero: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating featured flag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
