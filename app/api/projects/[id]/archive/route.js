import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH /api/projects/[id]/archive  { archived: boolean }
export async function PATCH(request, { params }) {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    try {
        const body = await request.json().catch(() => ({}))
        if (typeof body.archived !== 'boolean') {
            return NextResponse.json({ error: 'archived boolean required' }, { status: 400 })
        }
        const project = await prisma.project.update({
            where: { id },
            data: { archived: body.archived },
            select: { id: true, archived: true }
        })
        return NextResponse.json(project)
    } catch (e) {
        if (e?.code === 'P2025') {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }
        console.error('PATCH /api/projects/[id]/archive error', e)
        return NextResponse.json({ error: 'Failed to update archive state' }, { status: 500 })
    }
}
