import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page')) || 1
        const limit = parseInt(searchParams.get('limit')) || 12
        const search = searchParams.get('search') || ''
        const categorySlug = searchParams.get('category') || 'all'
        const filter = searchParams.get('filter') || 'recommended'

        const skip = (page - 1) * limit

        const whereClause = { show: true, archived: false }

        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { authors: { contains: search, mode: 'insensitive' } },
                { overview: { contains: search, mode: 'insensitive' } },
                { tags: { hasSome: [search] } }
            ]
        }

        if (categorySlug !== 'all') {
            whereClause.category = { slug: categorySlug }
        }

        // Special handling per filter
        let projects = []
        let totalCount = 0
        if (filter === 'recommended') {
            // Only recommended projects; ordered by recommendationRank asc
            whereClause.recommendationRank = { not: null }
            const [items, count] = await Promise.all([
                prisma.project.findMany({
                    where: whereClause,
                    orderBy: { recommendationRank: 'asc' },
                    skip,
                    take: limit,
                    include: {
                        teamMembers: { take: 3 },
                        addedByUser: { select: { name: true, email: true, username: true } },
                        pledges: { select: { userId: true, amount: true, status: true } },
                        category: { select: { id: true, name: true, slug: true, colorHex: true, textColor: true } },
                        budgetItems: { select: { id: true, name: true, value: true, allocated: true, position: true } }
                    }
                }),
                prisma.project.count({ where: whereClause })
            ])
            projects = items
            totalCount = count
        } else if (filter === 'funded') {
            const all = await prisma.project.findMany({
                where: whereClause,
                include: {
                    teamMembers: { take: 3 },
                    addedByUser: { select: { name: true, email: true, username: true } },
                    pledges: { select: { userId: true, amount: true, status: true } },
                    category: { select: { id: true, name: true, slug: true, colorHex: true, textColor: true } },
                    budgetItems: { select: { id: true, name: true, value: true, allocated: true, position: true } }
                }
            })
            const scored = all.map(p => {
                const paid = p.pledges?.filter(pl => (pl?.status || 'paid') === 'paid') || []
                const pledged = paid.reduce((s, pl) => s + (Number(pl.amount) || 0), 0)
                const goal = Number(p.goal) || 0
                let pct = goal > 0 ? pledged / goal : 0
                if (p.isCompleted) pct = 1
                if (pct > 1) pct = 1
                return { ...p, _pledgedDisplay: p.isCompleted && goal > 0 ? goal : pledged, _fundedPct: pct }
            })
            scored.sort((a, b) => {
                if (b._fundedPct !== a._fundedPct) return b._fundedPct - a._fundedPct
                if (a._fundedPct === 1 && b._fundedPct === 1) {
                    if (b.goal !== a.goal) return b.goal - a.goal
                }
                return new Date(b.createdAt) - new Date(a.createdAt)
            })
            totalCount = scored.length
            projects = scored.slice(skip, skip + limit).map(({ _fundedPct, _pledgedDisplay, ...rest }) => ({ ...rest, pledged: _pledgedDisplay }))
        } else {
            // newest / ending-soon and others
            let orderBy = {}
            switch (filter) {
                case 'newest': orderBy = { createdAt: 'desc' }; break
                case 'ending-soon': orderBy = { daysLeft: 'asc' }; break
                default: orderBy = { createdAt: 'desc' }
            }
            const [items, count] = await Promise.all([
                prisma.project.findMany({
                    where: whereClause,
                    orderBy,
                    skip,
                    take: limit,
                    include: {
                        teamMembers: { take: 3 },
                        addedByUser: { select: { name: true, email: true, username: true } },
                        pledges: { select: { userId: true, amount: true, status: true } },
                        category: { select: { id: true, name: true, slug: true, colorHex: true, textColor: true } },
                        budgetItems: { select: { id: true, name: true, value: true, allocated: true, position: true } }
                    }
                }),
                prisma.project.count({ where: whereClause })
            ])
            projects = items
            totalCount = count
        }

        const totalPages = Math.ceil(totalCount / limit)

        return NextResponse.json({
            projects,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        })
    } catch (error) {
        console.error('Error fetching discovery projects:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
