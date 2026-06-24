import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = Number(searchParams.get('limit'))
    // Default to 5 and cap to a maximum of 5 featured projects
    const take = Math.max(1, Math.min(5, isNaN(limitParam) ? 5 : limitParam))

    // Fetch projects that are not completed and not archived
    const projects = await prisma.project.findMany({
      where: { 
        isCompleted: false,
        archived: false
      },
      select: {
        id: true,
        title: true,
        tagline: true,
        slug: true,
        authors: true,
        image: true,
        imageAlt: true,
        location: true,
        overview: true,
        daysLeft: true,
        createdAt: true,
        goal: true,
        currency: true,
        category: {
          select: { id: true, name: true, slug: true, colorHex: true, textColor: true }
        },
        teamMembers: {
          select: { name: true, role: true, image: true, imageAlt: true }
        },
        pledges: {
          select: { amount: true, status: true, userId: true }
        },
        budgetItems: { select: { id: true, name: true, value: true, allocated: true, position: true } }
      },
    })

  
    const projectsWithFunding = projects.map(project => {
      const totalFunded = project.pledges
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0)
      
      return {
        ...project,
        totalFunded
      }
    })

   
    const topFunded = projectsWithFunding
      .sort((a, b) => b.totalFunded - a.totalFunded)
      .slice(0, take)

    return NextResponse.json(topFunded)
    return NextResponse.json(topFunded)
  } catch (error) {
    console.error('Error fetching featured projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
