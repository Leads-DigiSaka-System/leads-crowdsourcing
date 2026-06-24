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

        // Check if user is a researcher
        if (session.user.role !== 'researcher') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const userId = session.user.id

        // Fetch projects created by the user
        const projects = await prisma.project.findMany({
            where: {
                addedBy: userId,
                show: true, 
                archived: false
            },
            include: {
                pledges: {
                    where: {
                        status: 'paid'
                    },
                    select: {
                        amount: true
                    }
                }
            }
        })

        const projectCount = projects.length
        
        // Calculate total funds received
        let totalFunds = 0
        projects.forEach(project => {
            const projectTotal = project.pledges.reduce((sum, pledge) => sum + pledge.amount, 0)
            totalFunds += projectTotal
        })

       
        const claimableFunds = totalFunds

        return NextResponse.json({
            success: true,
            stats: {
                projectCount,
                totalFunds,
                claimableFunds
            }
        })

    } catch (error) {
        console.error('Error fetching researcher stats:', error)
        return NextResponse.json(
            { error: 'Failed to fetch researcher stats' },
            { status: 500 }
        )
    }
}
