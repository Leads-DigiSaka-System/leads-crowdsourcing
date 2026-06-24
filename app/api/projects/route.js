import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const archivedParam = searchParams.get('archived')
    let archivedFilter = undefined
    if (archivedParam === 'true') archivedFilter = true
    else if (archivedParam === 'false') archivedFilter = false

    const projects = await prisma.project.findMany({
      where: archivedFilter === undefined ? {} : { archived: archivedFilter },
      include: {
        teamMembers: true,
        budgetItems: {
          orderBy: [
            { position: 'asc' },
            { id: 'asc' }
          ]
        },
        pledges: { select: { amount: true,} },
        timelineEvents: { orderBy: { date: 'asc' } },
        addedByUser: { select: { name: true, email: true, username: true } },
        category: { select: { id: true, name: true, slug: true, colorHex: true, textColor: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawData = await request.json()


    let { categoryId } = rawData


    if (!categoryId && typeof rawData.category === 'string' && rawData.category.trim() !== '') {
      const found = await prisma.category.findFirst({ where: { name: rawData.category.trim() }, select: { id: true } })
      if (found) categoryId = found.id
    }

    const data = { ...rawData, categoryId }


    const calculatedGoal = Array.isArray(data.budgetItems) && data.budgetItems.length > 0
      ? data.budgetItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
      : Number(data.goal) || 0


    const missing = [
      'title', 'daysLeft', 'overview', 'methods', 'contextAnswer', 'significanceAnswer', 'goalsAnswer', 'teamDescription', 'budgetDescription', 'timelineDescription', 'currency'
    ].filter(f => !data[f] && data[f] !== 0)

    if (missing.length > 0) {
      return NextResponse.json({ error: 'Missing required fields: ' + missing.join(', ') }, { status: 400 })
    }


    if (data.categoryId) {
      const exists = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } })
      if (!exists) {
        return NextResponse.json({ error: 'Invalid categoryId supplied' }, { status: 400 })
      }
    }

    // Generate unique slug
    let baseSlug = slugify(data.title)
    if (!baseSlug) {
      baseSlug = 'project'
    }
    let finalSlug = baseSlug
    let counter = 2
    while (await prisma.project.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter}`
      counter++
    }

    const project = await prisma.project.create({
      data: {
        addedBy: session.user.id,
        title: data.title,
        tagline: data.tagline,
        slug: finalSlug,
        authors: data.authors,
        location: data.location,
        image: data.image,
        imageAlt: data.imageAlt,
        // Pledged is derived from donations; never accept from client
        pledged: 0,
        goal: calculatedGoal, // Use calculated goal
        currency: data.currency || 'PHP',
        daysLeft: data.daysLeft,
        tags: data.tags || [],
        categoryId: data.categoryId || null,
        overview: data.overview,
        methods: data.methods,
        labNotes: data.labNotes,
        discussion: data.discussion,
        contextAnswer: data.contextAnswer,
        significanceAnswer: data.significanceAnswer,
        goalsAnswer: data.goalsAnswer,
        teamDescription: data.teamDescription,
        budgetDescription: data.budgetDescription,
        timelineDescription: data.timelineDescription,
        timelineDurationMonths: data.timelineDurationMonths ?? null,
        teamMembers: { create: data.teamMembers || [] },
        budgetItems: {
          create: Array.isArray(data.budgetItems)
            ? data.budgetItems.map((it, idx) => ({
              name: it.name,
              description: it.description || null,
              value: Number(it.value) || 0,
              position: idx,
            }))
            : []
        },
        timelineEvents: { create: data.timelineEvents || [] }
      },
      include: {
        teamMembers: true,
        budgetItems: {
          orderBy: [
            { position: 'asc' },
            { id: 'asc' }
          ]
        },
        timelineEvents: true,
        addedByUser: { select: { name: true, email: true, username: true } },
        category: { select: { id: true, name: true, slug: true, colorHex: true, textColor: true } }
      }
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
