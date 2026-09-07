require('dotenv/config')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

// Slugify function matching the one in utils.js
function slugify(str) {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except -
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function populateSlugs() {
  try {
    console.log('🔍 Finding projects without slugs...\n');
    
    // Get all projects without slugs
    const projectsWithoutSlugs = await prisma.project.findMany({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (projectsWithoutSlugs.length === 0) {
      console.log('✅ All projects already have slugs!');
      return;
    }

    console.log(`Found ${projectsWithoutSlugs.length} projects without slugs\n`);

    // Track used slugs to handle duplicates
    const usedSlugs = new Set();
    
    // Get existing slugs from database
    const existingProjects = await prisma.project.findMany({
      where: {
        slug: { not: null }
      },
      select: {
        slug: true
      }
    });
    
    existingProjects.forEach(p => {
      if (p.slug) usedSlugs.add(p.slug);
    });

    let updated = 0;
    let errors = 0;

    for (const project of projectsWithoutSlugs) {
      try {
        let baseSlug = slugify(project.title);
        
        // If slugify returns empty, use the id
        if (!baseSlug) {
          baseSlug = `project-${project.id.slice(0, 8)}`;
        }
        
        // Handle duplicates by appending numbers
        let finalSlug = baseSlug;
        let counter = 2;
        
        while (usedSlugs.has(finalSlug)) {
          finalSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        // Update the project
        await prisma.project.update({
          where: { id: project.id },
          data: { slug: finalSlug }
        });
        
        usedSlugs.add(finalSlug);
        updated++;
        
        console.log(`✅ ${updated}. "${project.title}" → ${finalSlug}`);
        
      } catch (error) {
        errors++;
        console.error(`❌ Failed to update "${project.title}": ${error.message}`);
      }
    }

    console.log(`\n✨ Done! Updated ${updated} projects`);
    if (errors > 0) {
      console.log(`⚠️  ${errors} errors occurred`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

populateSlugs();
