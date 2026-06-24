import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const session = await auth()

        // Check if user is admin
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter') || 'monthly'
        const pageParam = parseInt(searchParams.get('page') || '1', 10)
        const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
        const pageSize = 10

        // Calculate date range based on filter
        const now = new Date()
        let startDate = new Date()

        switch (filter) {
            case 'weekly':
                startDate.setDate(now.getDate() - 7)
                break
            case 'monthly':
                startDate.setMonth(now.getMonth() - 1)
                break
            case 'yearly':
                startDate.setFullYear(now.getFullYear() - 1)
                break
            default:
                startDate.setMonth(now.getMonth() - 1)
        }

        const whereFilter = {
            status: 'paid',
            createdAt: { gte: startDate },
        }

        // Fetch donations with user and project details (paginated)
        const donations = await prisma.pledge.findMany({
            where: whereFilter,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        username: true,
                        image: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                        category: true
                    }
                },


            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        })

        // Total count for pagination
        const total = await prisma.pledge.count({ where: whereFilter })

        // Calculate analytics from full filtered dataset
        const [sumAgg, countAgg, distinctDonors] = await Promise.all([
            prisma.pledge.aggregate({ where: whereFilter, _sum: { amount: true } }),
            prisma.pledge.count({ where: whereFilter }),
            prisma.pledge.findMany({ where: whereFilter, distinct: ['userId'], select: { userId: true } })
        ])

        const totalAmount = sumAgg._sum.amount || 0
        const totalDonations = countAgg
        const uniqueDonors = distinctDonors.length

        const analytics = {
            totalAmount,
            totalDonations,
            uniqueDonors
        }

        return NextResponse.json({
            success: true,
            donations,
            analytics,
            page,
            pageSize,
            total
        })

    } catch (error) {
        console.error('Error fetching donations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch donations' },
            { status: 500 }
        )
    }
}
