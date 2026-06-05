import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('client123', 10)
  const client = await prisma.user.upsert({
    where: { email: 'client@kapusta.dev' },
    update: { passwordHash: hash, role: 'CLIENT' },
    create: {
      email: 'client@kapusta.dev',
      name: 'Тестовый Клиент',
      passwordHash: hash,
      role: 'CLIENT',
    },
  })
  console.log('Client created:', client.email)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
