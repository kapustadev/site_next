import { config } from "dotenv"
config()

import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

async function main() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL не задан")

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  const email = "info@kapusta.dev"
  const password = "Obereb39#"
  const name = "Dmytro Kapusta"

  const passwordHash = await bcrypt.hash(password, 12)

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: "OWNER", name }
    })
    console.log("✅ User updated:", email)
  } else {
    await prisma.user.create({
      data: { email, name, passwordHash, role: "OWNER" }
    })
    console.log("✅ Admin user created:", email)
  }

  await prisma.$disconnect()
  await pool.end()
}

main().catch(e => {
  console.error("❌ Error:", e)
  process.exit(1)
})
