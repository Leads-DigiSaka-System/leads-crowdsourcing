require('dotenv/config')
const { PrismaPg } = require('@prisma/adapter-pg')
// Use CommonJS for compatibility
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
    console.log('🌱 Seeding pledges for test donors...');

    // Use your dummy users
    const donorUsernames = [
        'testing123', 'testing1234', 'testing12345'
    ];
    const donors = await prisma.user.findMany({
        where: { username: { in: donorUsernames } },
        select: { id: true, username: true }
    });
    const donorMap = Object.fromEntries(donors.map(d => [d.username, d.id]));

    // Get all projects to assign pledges to
    const allProjects = await prisma.project.findMany({ select: { id: true } });
    if (allProjects.length === 0) {
        console.error('❌ No projects found. Seed projects first.');
        process.exit(1);
    }

    // Pledge data for your dummy users
    const pledgeData = [
        // Top donor - testing123
        { username: 'testing123', amount: 500, status: 'paid' },
        { username: 'testing123', amount: 250, status: 'paid' },
        { username: 'testing123', amount: 150, status: 'paid' },
        // Second top donor - testing1234
        { username: 'testing1234', amount: 400, status: 'paid' },
        { username: 'testing1234', amount: 300, status: 'paid' },
        // Third top donor - testing12345
        { username: 'testing12345', amount: 350, status: 'paid' },
        { username: 'testing12345', amount: 200, status: 'paid' },
    ];

    // Create pledges and assign them to random projects
    for (const pledge of pledgeData) {
        const userId = donorMap[pledge.username];
        if (!userId) {
            console.warn(`⚠️ User not found: ${pledge.username}`);
            continue;
        }
        const randomProject = allProjects[Math.floor(Math.random() * allProjects.length)];
        await prisma.pledge.create({
            data: {
                userId,
                projectId: randomProject.id,
                amount: pledge.amount,
                status: pledge.status,
                paymongoId: `test_${Math.random().toString(36).substr(2, 9)}`,
            },
        });
    }

    console.log(`✅ Created ${pledgeData.length} test pledges for donors.`);
}

main()
    .catch((e) => {
        console.error('❌ Error seeding pledges:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
