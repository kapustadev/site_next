const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const projects = await prisma.project.findMany({
    include: { columns: true }
  })

  for (const p of projects) {
    if (p.columns.length === 0) {
      console.log(`Adding columns to project ${p.name}...`)
      await prisma.project.update({
        where: { id: p.id },
        data: {
          columns: {
            create: [
              { name: 'Backlog', color: '#64748b', order: 0 },
              { name: 'To Do', color: '#3b82f6', order: 1 },
              { name: 'В работе', color: '#f59e0b', order: 2, notifyClient: true },
              { name: 'Ревью', color: '#8b5cf6', order: 3 },
              { name: 'Тестирование', color: '#06b6d4', order: 4 },
              { name: 'Готово', color: '#22c55e', order: 5, notifyClient: true },
            ]
          }
        }
      })
    } else {
      console.log(`Project ${p.name} already has columns.`)
    }
  }
  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
