import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20)

        // Fetch users with their paid pledges, then aggregate in JS
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                pledges: {
                    where: { status: 'paid' },
                    select: { amount: true }
                }
            }
        })

        const donors = users
            .map(u => ({
                id: u.id,
                name: u.name,
                username: u.username,
                image: u.image,
                totalDonated: u.pledges.reduce((sum, p) => sum + p.amount, 0),
                donationCount: u.pledges.length
            }))
            .filter(d => d.totalDonated > 0)
            .sort((a, b) => b.totalDonated - a.totalDonated)
            .slice(0, limit)

        return NextResponse.json(donors)
    } catch (error) {
        console.error('Error fetching top donors:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
