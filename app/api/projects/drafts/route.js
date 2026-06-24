import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Create or update a draft (id optional in body). Only merges provided fields into existing data.
// Accepts forceNew flag to always create a new draft even if one exists (used when user selects 'New Draft').
export async function POST(request) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { draftId, data: partial, forceNew } = body || {}
    if (!partial || typeof partial !== 'object') {
      return NextResponse.json({ error: 'Missing data payload' }, { status: 400 })
    }

    // Sanitize: remove undefined values (Prisma Json can't store undefined)
    const cleaned = Object.fromEntries(Object.entries(partial).filter(([, v]) => v !== undefined))

    let draft
    if (draftId) {
      draft = await prisma.projectDraft.findUnique({ where: { id: draftId } })
      if (!draft) return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      if (draft.addedBy !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    } else {
      if (!forceNew) {
        // Reuse the most recently updated draft for this user (single active draft strategy)
        draft = await prisma.projectDraft.findFirst({ where: { addedBy: session.user.id }, orderBy: { updatedAt: 'desc' } })
      }
    }

    if (draft) {
      const mergedData = { ...(draft.data || {}), ...cleaned }
      draft = await prisma.projectDraft.update({ where: { id: draft.id }, data: { data: mergedData } })
    } else {
      draft = await prisma.projectDraft.create({ data: { addedBy: session.user.id, data: cleaned } })
    }
    return NextResponse.json({ id: draft.id, updatedAt: draft.updatedAt })
  } catch (e) {
    console.error('Draft save error', e)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

// Optionally list current user's drafts (for future UI)
export async function GET() {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const drafts = await prisma.projectDraft.findMany({ where: { addedBy: session.user.id }, orderBy: { updatedAt: 'desc' }, take: 10 })
    return NextResponse.json(drafts.map(d => ({ id: d.id, updatedAt: d.updatedAt, data: d.data })))
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load drafts' }, { status: 500 })
  }
}