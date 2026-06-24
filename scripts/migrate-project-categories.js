const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateCategories() {
    const projects = await prisma.project.findMany();

    for (const project of projects) {
        if (!project.category) continue; // Skip if no category string

        // Find the matching category by name
        const category = await prisma.category.findUnique({
            where: { name: project.category }
        });

        if (category) {
            await prisma.project.update({
                where: { id: project.id },
                data: { categoryId: category.id }
            });
            console.log(`Updated project ${project.id} with categoryId ${category.id}`);
        } else {
            console.warn(`No matching category for project ${project.id} (${project.category})`);
        }
    }
}

migrateCategories()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());