import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const session = await auth()

        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get total counts
        const totalProjects = await prisma.project.count()
        const totalUsers = await prisma.user.count()
        const totalPledges = await prisma.pledge.count()

        // Get total funding from pledges (real data)
        const totalFunding = await prisma.pledge.aggregate({
            _sum: {
                amount: true
            },
            where: {
                status: 'paid' // Only count paid pledges
            }
        })

        // Get projects by category using categoryId
        const projectsByCategoryRaw = await prisma.project.groupBy({
            by: ['categoryId'],
            _count: {
                id: true
            }
        })

        // Get category names for the grouped data
        const categoryIds = projectsByCategoryRaw.map(item => item.categoryId).filter(Boolean)
        const categories = await prisma.category.findMany({
            where: {
                id: {
                    in: categoryIds
                }
            },
            select: {
                id: true,
                name: true,
                slug: true,
                colorHex: true
            }
        })

        // Combine the data to include category names
        const projectsByCategory = projectsByCategoryRaw.map(item => {
            const category = categories.find(cat => cat.id === item.categoryId)
            return {
                categoryId: item.categoryId,
                category: category?.name || 'Uncategorized',
                categoryName: category?.name || 'Uncategorized',
                categorySlug: category?.slug || 'uncategorized',
                categoryColor: category?.colorHex || '#e0f2fe',
                _count: { id: item._count.id },
                count: item._count.id
            }
        })

        // Get recent projects
        const recentProjects = await prisma.project.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                addedByUser: {
                    select: {
                        name: true,
                        username: true
                    }
                },
                teamMembers: {
                    select: {
                        name: true
                    }
                },
                category: {
                    select: {
                        name: true
                    }
                }
            }
        })

        // Get top funded projects via sum of paid pledges
        const pledgeSums = await prisma.pledge.groupBy({
            by: ['projectId'],
            where: { status: 'paid' },
            _sum: { amount: true },
            orderBy: { _sum: { amount: 'desc' } },
            take: 5
        })

        const topProjectIds = pledgeSums.map(p => p.projectId)
        const topProjectsRaw = topProjectIds.length
            ? await prisma.project.findMany({
                where: { id: { in: topProjectIds } },
                select: {
                    id: true,
                    title: true,
                    goal: true,
                    category: { select: { name: true } }
                }
            })
            : []

        const topProjectsMap = new Map(topProjectsRaw.map(p => [p.id, p]))
        const topFundedProjects = pledgeSums.map(ps => ({
            id: ps.projectId,
            title: topProjectsMap.get(ps.projectId)?.title || 'Unknown',
            goal: topProjectsMap.get(ps.projectId)?.goal || 0,
            category: topProjectsMap.get(ps.projectId)?.category || null,
            pledged: ps._sum.amount || 0
        }))

        // Get pledge status distribution
        const pledgeStatusDistribution = await prisma.pledge.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        })

        // Get recent donations (pledges) with user and project data
        const recentDonations = await prisma.pledge.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true
                    }
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                        category: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            totals: {
                projects: totalProjects,
                users: totalUsers,
                pledges: totalPledges,
                funding: totalFunding._sum.amount || 0
            },
            projectsByCategory,
            recentProjects,
            topFundedProjects,
            pledgeStatusDistribution,
            recentDonations
        })
    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
