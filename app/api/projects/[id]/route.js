import { slugify } from '@/lib/utils';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server'; // Import NextResponse for App Router API routes

const prisma = new PrismaClient();

// GET handler for fetching a single project by id
export async function GET(request, { params }) {
  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
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
                    user: { select: { name: true } }
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        timelineEvents: { orderBy: { date: 'asc' } },
        addedByUser: { select: { name: true, email: true, username: true } },
        pledges: { select: { amount: true, status: true } }
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

// PUT handler for updating a project
export async function PUT(request, { params }) {
  const { id } = await params; // Access id from params object
  const data = await request.json(); // Access request body using request.json()

  try {
    // Handle backward compatibility: if categoryId missing but legacy category name provided
    let { categoryId } = data;
    if (!categoryId && typeof data.category === 'string' && data.category.trim() !== '') {
      const found = await prisma.category.findFirst({ where: { name: data.category.trim() }, select: { id: true } });
      if (found) categoryId = found.id;
    }

    if (categoryId) {
      const exists = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
      if (!exists) {
        return NextResponse.json({ error: 'Invalid categoryId supplied' }, { status: 400 });
      }
    }

    // Use a transaction to ensure data consistency
    const project = await prisma.$transaction(async (tx) => {
      // Fetch existing budget items with allocation counts to determine which can be deleted
      const existingBudgetItems = await tx.budgetItem.findMany({
        where: { projectId: id },
        include: { allocations: { select: { id: true } } }
      });

      const incomingItems = Array.isArray(data.budgetItems) ? data.budgetItems : [];

      // Build maps for easier lookup
      const existingById = new Map(existingBudgetItems.map(b => [b.id, b]));
      // Preserve incoming order index for persistence
      const indexById = new Map();
      incomingItems.forEach((it, idx) => {
        if (it?.id) indexById.set(it.id, idx);
      });

      // 1. Update existing items that appear in incoming (matched by id)
      for (let i = 0; i < incomingItems.length; i++) {
        const incoming = incomingItems[i];
        if (incoming.id && existingById.has(incoming.id)) {
          // Only update mutable fields
          await tx.budgetItem.update({
            where: { id: incoming.id },
            data: {
              name: incoming.name,
              description: incoming.description,
              value: incoming.value,
              // Persist order if supported by schema
              position: i,
            }
          });
        }
      }

      // 2. Create new items (those without id)
      const itemsToCreate = incomingItems
        .map((it, idx) => ({ ...it, __idx: idx }))
        .filter(it => !it.id);
      if (itemsToCreate.length) {
        await tx.budgetItem.createMany({
          data: itemsToCreate.map(it => ({
            projectId: id,
            name: it.name,
            description: it.description || null,
            value: it.value,
            position: it.__idx,
          }))
        });
      }

      // 3. Delete removed items that have NO allocations
      const incomingIds = new Set(incomingItems.filter(it => it.id).map(it => it.id));
      const deletableIds = existingBudgetItems
        .filter(ex => !incomingIds.has(ex.id) && ex.allocations.length === 0)
        .map(ex => ex.id);
      if (deletableIds.length) {
        await tx.budgetItem.deleteMany({ where: { id: { in: deletableIds } } });
      }

      // 4. Recompute goal from current (post-update) set of items
      const finalBudgetItems = await tx.budgetItem.findMany({ where: { projectId: id }, select: { value: true } });
      const calculatedGoal = finalBudgetItems.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

      // Check if title changed and update slug if needed
      const currentProject = await tx.project.findUnique({ where: { id }, select: { title: true, slug: true } });
      let newSlug = currentProject?.slug;
      
      if (data.title && data.title !== currentProject?.title) {
        let baseSlug = slugify(data.title);
        if (!baseSlug) {
          baseSlug = 'project';
        }
        let finalSlug = baseSlug;
        let counter = 2;
        // Check for unique slug, excluding current project
        while (true) {
          const existing = await tx.project.findUnique({ where: { slug: finalSlug } });
          if (!existing || existing.id === id) break;
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        newSlug = finalSlug;
      }

      const updatedProject = await tx.project.update({
        where: {
          id: id // Use the id from params
        },
        data: {
          title: data.title,
          tagline: data.tagline,
          slug: newSlug,
          authors: data.authors,
          location: data.location,
          image: data.image,
          imageAlt: data.imageAlt || data.title,
          goal: calculatedGoal,
          currency: data.currency || "PHP",
          daysLeft: data.daysLeft,
          tags: data.tags,
          categoryId: categoryId || null,
          overview: data.overview,
          methods: data.methods,
          labNotes: data.labNotes,
          discussion: data.discussion,
          contextAnswer: data.contextAnswer,
          significanceAnswer: data.significanceAnswer,
          goalsAnswer: data.goalsAnswer,
          teamDescription: data.teamDescription,
          budgetDescription: data.budgetDescription,
          timelineDescription: data.timelineDescription,
          timelineDurationMonths: data.timelineDurationMonths ?? null,
          // For nested writes (create/update/delete related records),
          // you need to handle them carefully. For simplicity, if you're
          // sending full arrays, Prisma will try to create new ones.
          // If you need to update existing, you'd typically fetch, compare,
          // and then use `updateMany` or `deleteMany` + `createMany`.
          // For now, assuming `teamMembers`, `budgetItems`, `timelineEvents`
          // are sent as full replacements or new creations.
          // If these are existing records, you'll need to adjust this logic
          // to handle updates/deletions of existing related records.
          teamMembers: {
            deleteMany: {}, // Delete all existing team members
            createMany: { data: data.teamMembers || [] } // Recreate them
          },
          // budgetItems handled manually above (updates/creates/deletes). No nested write here.
          timelineEvents: {
            deleteMany: {}, // Delete all existing timeline events
            createMany: { data: data.timelineEvents || [] } // Recreate them
          }
        },
        include: {
          teamMembers: true,
          budgetItems: true,
          timelineEvents: true,
          addedByUser: {
            select: {
              name: true,
              email: true,
              username: true
            }
          },
          category: { select: { id: true, name: true, slug: true, colorHex: true, textColor: true } }
        }
      });

      // Ensure response budgetItems follow incoming order even if DB doesn't persist position yet
      if (Array.isArray(updatedProject?.budgetItems) && Array.isArray(incomingItems) && incomingItems.length) {
        const orderKey = new Map();
        incomingItems.forEach((it, idx) => {
          if (it.id) orderKey.set(it.id, idx);
        });
        updatedProject.budgetItems = [...updatedProject.budgetItems].sort((a, b) => {
          const ai = orderKey.has(a.id) ? orderKey.get(a.id) : Number.MAX_SAFE_INTEGER;
          const bi = orderKey.has(b.id) ? orderKey.get(b.id) : Number.MAX_SAFE_INTEGER;
          return ai - bi || (a.position ?? 0) - (b.position ?? 0) || (a.id - b.id);
        });
      }

      return updatedProject;
    });

    return NextResponse.json(project); // Use NextResponse.json() for responses
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE handler for deleting a project (from projects-data-table.tsx)
export async function DELETE(request, { params }) {
  const { id } = await params;
  try {
    const existing = await prisma.project.findUnique({ where: { id }, select: { id: true, archived: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    if (!existing.archived) {
      const updated = await prisma.project.update({ where: { id }, data: { archived: true } });
      return NextResponse.json({ message: 'Project moved to archive', archived: true, id: updated.id });
    }
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: 'Project permanently deleted', id });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
