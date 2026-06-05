import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  let general = await prisma.chatGroup.findFirst({ where: { name: 'Общий чат команды' } })
  if (!general) {
    general = await prisma.chatGroup.create({
      data: { name: 'Общий чат команды', isDirect: false }
    })
  }
  
  const users = await prisma.user.findMany({ where: { role: { in: ['OWNER', 'PM', 'EMPLOYEE'] } } })
  for (const user of users) {
    await prisma.chatMember.upsert({
      where: { groupId_userId: { groupId: general.id, userId: user.id } },
      create: { groupId: general.id, userId: user.id },
      update: {}
    })
  }
  console.log('Global chat seeded!')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
