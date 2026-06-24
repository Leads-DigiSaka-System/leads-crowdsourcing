import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET handler for fetching a single project by slug (or ID as fallback)
export async function GET(request, { params }) {
  const { slug } = await params;
  
  try {
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug } // Fallback to ID for backward compatibility
        ]
      },
      include: {
        teamMembers: true,
        budgetItems: {
          orderBy: [
            { position: 'asc' },
            { id: 'asc' }
          ],
          include: {
            allocations: {
              include: {
                pledge: {
                  select: {
                    status: true,
                    solanaSignature: true,
                    user: { select: { name: true } },
                    userId: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        timelineEvents: { orderBy: { date: 'asc' } },
        addedByUser: { select: { name: true, email: true, username: true } },
        pledges: { select: { amount: true, status: true, userId: true } },
        category: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}
