import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { pdf } from '@react-pdf/renderer'
import Certificate from '@/components/Certificate'

export async function POST(request) {
    try {
        const session = await auth()

        // Check if user is authenticated
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

       
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                username: true,
                companyLogo: true
            }
        })

        // Get user's total donations
        const userDonations = await prisma.pledge.findMany({
            where: {
                userId: userId,
                status: 'paid'
            },
            include: {
                project: {
                    select: {
                        title: true,
                        category: true
                    }
                }
            }
        })

        if (userDonations.length === 0) {
            return NextResponse.json({ error: 'No donations found' }, { status: 400 })
        }

        const totalAmount = userDonations.reduce((sum, donation) => sum + donation.amount, 0)
        const totalDonations = userDonations.length
        const supportedProjects = new Set(userDonations.map(d => d.projectId)).size

        console.log('Certificate data:', { totalAmount, totalDonations, supportedProjects, userName: session.user.name || session.user.username })

        // Generate PDF certificate
        const certificateProps = {
            userName: user?.name || user?.username || 'Valued Contributor',
            totalAmount: Number(totalAmount),
            totalDonations: Number(totalDonations),
            supportedProjects: Number(supportedProjects),
            userDonations,
            companyLogo: user?.companyLogo || 'https://www.impactofresearch.fund/researchbayanihan_logo.png',
            issueDate: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        }

        // Generate PDF buffer
        const pdfBuffer = await pdf(<Certificate {...certificateProps} />).toBuffer()

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="donation-certificate-${session.user.username || 'user'}.pdf"`
            }
        })

    } catch (error) {
        console.error('Error generating certificate:', error)
        return NextResponse.json(
            { error: 'Failed to generate certificate' },
            { status: 500 }
        )
    }
}
