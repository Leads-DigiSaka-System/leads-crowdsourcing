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
        const nextValue = typeof body.show === 'boolean' ? body.show : true

        const updated = await prisma.project.update({
            where: { id },
            data: { show: nextValue },
            select: { id: true, show: true },
        })
        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating visibility:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
