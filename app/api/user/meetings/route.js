import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
    try {
        const session = await auth()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Prevent admins from accessing user meetings API
        if (session.user.role === 'admin') {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page')) || 1
        const limit = parseInt(searchParams.get('limit')) || 10
        const skip = (page - 1) * limit

        const [meetingRequests, totalCount] = await Promise.all([
            prisma.meetingRequest.findMany({
                where: { userId: session.user.id },
                include: {
                    project: {
                        select: {
                            id: true,
                            title: true,
                            authors: true,
                        }
                    },
                    messages: {
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    name: true,
                                    role: true,
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.meetingRequest.count({
                where: { userId: session.user.id }
            })
        ])

        return NextResponse.json({
            meetingRequests,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page,
            limit
        })
    } catch (error) {
        console.error('Error fetching user meetings:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}