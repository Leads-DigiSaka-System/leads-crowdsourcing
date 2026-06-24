import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request, { params }) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { id } = await params
        const draft = await prisma.projectDraft.findUnique({ where: { id } })
        if (!draft || draft.addedBy !== session.user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ id: draft.id, data: draft.data, updatedAt: draft.updatedAt })
    } catch (e) {
        console.error('Load draft error', e)
        return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 })
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await auth()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { id } = await params
        const draft = await prisma.projectDraft.findUnique({ where: { id } })
        if (!draft) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (draft.addedBy !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        await prisma.projectDraft.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Delete draft error', e)
        return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
    }
}