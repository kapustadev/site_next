import { prisma } from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('Seeding database...')

  // Create a test client
  const clientEmail = 'client@test.com'
  let client = await prisma.user.findUnique({ where: { email: clientEmail } })
  
  if (!client) {
    const passwordHash = await bcrypt.hash('client123', 12)
    client = await prisma.user.create({
      data: {
        name: 'Тестовый Клиент',
        email: clientEmail,
        passwordHash,
        role: 'CLIENT'
      }
    })
    console.log(`Created test client: ${clientEmail} / client123`)
  } else {
    console.log(`Test client already exists: ${clientEmail}`)
  }

  // Check if owner exists to be the PM
  let owner = await prisma.user.findFirst({ where: { role: 'OWNER' } })
  if (!owner) {
    const passwordHash = await bcrypt.hash('admin123', 12)
    owner = await prisma.user.create({
      data: {
        name: 'Владелец',
        email: 'admin@test.com',
        passwordHash,
        role: 'OWNER'
      }
    })
    console.log('Created owner.')
  }

  // Create a project for the client
  let project = await prisma.project.findFirst({ where: { clientId: client.id } })
  
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Сайт для ТестКлиента',
        description: 'Разработка корпоративного сайта с каталогом',
        budget: 15000,
        currency: 'PLN',
        budgetPln: 15000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        managerId: owner.id,
        clientId: client.id,
        members: {
          create: [
            { userId: owner.id },
            { userId: client.id }
          ]
        },
        tasks: {
          create: [
            { title: 'Дизайн главной страницы', status: 'DONE' },
            { title: 'Верстка главной', status: 'IN_PROGRESS' },
            { title: 'Интеграция CMS', status: 'TODO' }
          ]
        }
      }
    })
    console.log('Created test project for client.')
  } else {
    console.log('Project for client already exists.')
  }

  // Create invoices for the client
  const existingInvoices = await prisma.invoice.count({ where: { clientId: client.id } })
  
  if (existingInvoices === 0) {
    await prisma.invoice.createMany({
      data: [
        {
          number: 'INV-001',
          projectId: project.id,
          clientId: client.id,
          amount: 5000,
          currency: 'PLN',
          status: 'PAID',
          description: 'Аванс за разработку',
          issuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          number: 'INV-002',
          projectId: project.id,
          clientId: client.id,
          amount: 5000,
          currency: 'PLN',
          status: 'PENDING',
          description: 'Оплата этапа дизайна',
          issuedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }
      ]
    })
    console.log('Created test invoices.')
  } else {
    console.log('Invoices already exist.')
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
