import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

declare global {
  var __prisma: PrismaClient | undefined
}

function createPrisma() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL не задан")
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalThis.__prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma
}
