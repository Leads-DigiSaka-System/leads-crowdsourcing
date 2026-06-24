import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(request) {
    try {
        const session = await auth()

        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { companyLogo } = body

        // Validate that companyLogo is a string URL or empty
        if (companyLogo !== undefined && companyLogo !== null && companyLogo !== "" && typeof companyLogo !== "string") {
            return NextResponse.json({ error: 'Invalid company logo URL' }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { companyLogo: companyLogo || null },
            select: {
                id: true,
                name: true,
                username: true,
                email: true,
                image: true,
                companyLogo: true,
            }
        })

        return NextResponse.json({ 
            success: true, 
            user: updatedUser 
        })

    } catch (error) {
        console.error('Error updating company logo:', error)
        return NextResponse.json(
            { error: 'Failed to update company logo' },
            { status: 500 }
        )
    }
}
