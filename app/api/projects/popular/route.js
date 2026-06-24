import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '3', 10), 12)

        const projects = await prisma.project.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                teamMembers: { take: 3 },
                addedByUser: {
                    select: { name: true, email: true, username: true }
                },
                pledges: { select: { userId: true, amount: true, status: true } },
                budgetItems: { select: { id: true, name: true, value: true, allocated: true, position: true } }
            }
        })

        return NextResponse.json(projects)
    } catch (error) {
        console.error('Error fetching popular projects:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
