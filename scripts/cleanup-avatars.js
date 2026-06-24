// Cleanup script to nullify default avatar URLs in the database
// Only affects exact matches of 'https://avatar.iran.liara.run/public' for User.image and TeamMember.image

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const DEFAULT_AVATAR = 'https://avatar.iran.liara.run/public'

async function main() {
  console.log('Starting avatar cleanup...')

  const [userResult, teamMemberResult] = await Promise.all([
    prisma.user.updateMany({
      where: { image: DEFAULT_AVATAR },
      data: { image: null },
    }),
    prisma.teamMember.updateMany({
      where: { image: DEFAULT_AVATAR },
      data: { image: null },
    }),
  ])

  console.log(`Users updated: ${userResult.count}`)
  console.log(`Team members updated: ${teamMemberResult.count}`)
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
