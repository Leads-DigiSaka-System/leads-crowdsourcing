import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20)

        // Fetch recent donations with project details
        const donations = await prisma.pledge.findMany({
            where: {
                status: 'paid'
            },
            take: limit,
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                amount: true,
                solanaSignature: true,
                createdAt: true,
                project: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                }
            }
        })

        return NextResponse.json({ success: true, donations })
    } catch (error) {
        console.error('Error fetching recent donations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch recent donations' },
            { status: 500 }
        )
    }
}
