import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const session = await auth()

        // Check if user is authenticated
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        // Removed filter param
        const pageParam = parseInt(searchParams.get('page') || '1', 10)
        const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
        const pageSize = 10
        const userId = session.user.id

        // No date filtering - fetch all
        const whereFilter = {
            userId: userId,
            status: 'paid',
        }

        // Fetch user's donations with project details (paginated)
        const donations = await prisma.pledge.findMany({
            where: whereFilter,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        authors: true,
                        category: true
                    }
                }
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
        const sumAgg = await prisma.pledge.aggregate({ where: whereFilter, _sum: { amount: true } })
        const totalDonations = await prisma.pledge.count({ where: whereFilter })
        const projectDistinct = await prisma.pledge.findMany({ where: whereFilter, distinct: ['projectId'], select: { projectId: true } })
        const totalAmount = sumAgg._sum.amount || 0
        const supportedProjects = projectDistinct.length

        // Chart data from full dataset
        const chartSource = await prisma.pledge.findMany({
            where: whereFilter,
            select: { createdAt: true, amount: true },
            orderBy: { createdAt: 'asc' }
        })
        const chartData = []
        const periodMap = new Map()
        chartSource.forEach((donation) => {
            const date = new Date(donation.createdAt)
            // Default to monthly grouping for all-time view
            const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            
            if (!periodMap.has(periodKey)) {
                periodMap.set(periodKey, { period: periodKey, amount: 0, count: 0 })
            }
            const period = periodMap.get(periodKey)
            period.amount += donation.amount
            period.count += 1
        })
        chartData.push(...Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period)))

        const analytics = { totalAmount, totalDonations, supportedProjects, chartData }

        return NextResponse.json({
            success: true,
            donations,
            analytics,
            page,
            pageSize,
            total
        })

    } catch (error) {
        console.error('Error fetching user donations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch donations' },
            { status: 500 }
        )
    }
}
