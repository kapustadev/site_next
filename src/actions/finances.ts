'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getTransactions() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  if ((session.user as any).role !== 'OWNER') throw new Error('Нет прав')

  return prisma.transaction.findMany({
    orderBy: { date: 'desc' },
    include: { project: { select: { name: true } } }
  })
}

export async function createTransaction(data: {
  type: 'INCOME' | 'EXPENSE'
  description: string
  category?: string
  amount: number
  currency: string
  projectId?: string
  date?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  if ((session.user as any).role !== 'OWNER') throw new Error('Нет прав')

  // Fetch exchange rates from our internal API (which caches NBP)
  // Need absolute URL for fetch in server action, or just call the DB/NBP directly.
  // Since we are server-side, it's easier to just do what the API does, but calling the API via absolute URL might be tricky if we don't know the host.
  // Let's implement the NBP fetch logic directly here for the conversion, or query the cache.

  const SUPPORTED = ['USD', 'EUR', 'UAH', 'GBP', 'CHF', 'CZK', 'HUF']
  let rateToPln = 1

  if (data.currency !== 'PLN' && SUPPORTED.includes(data.currency)) {
    const cached = await prisma.exchangeRateCache.findUnique({
      where: { currency: data.currency }
    })
    const now = Date.now()
    const CACHE_TTL_MS = 60 * 60 * 1000

    if (cached && (now - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS)) {
      rateToPln = cached.rateToPln
    } else {
      // Fetch fresh
      try {
        const res = await fetch('https://api.nbp.pl/api/exchangerates/tables/A/?format=json')
        if (res.ok) {
          const json = await res.json()
          const rateObj = json[0].rates.find((r: any) => r.code === data.currency)
          if (rateObj) {
            rateToPln = rateObj.mid
            await prisma.exchangeRateCache.upsert({
              where: { currency: data.currency },
              create: { currency: data.currency, rateToPln, fetchedAt: new Date() },
              update: { rateToPln, fetchedAt: new Date() }
            })
          }
        }
      } catch (e) {
        console.error('NBP fetch error', e)
        if (cached) rateToPln = cached.rateToPln // fallback to stale cache
      }
    }
  }

  const amountPln = data.amount * rateToPln

  const transaction = await prisma.transaction.create({
    data: {
      type: data.type,
      description: data.description,
      category: data.category || undefined,
      amount: data.amount,
      currency: data.currency as any,
      amountPln,
      exchangeRate: rateToPln,
      projectId: data.projectId || undefined,
      date: data.date ? new Date(data.date) : new Date(),
    }
  })

  revalidatePath('/[locale]/finances', 'page')
  revalidatePath('/[locale]/dashboard', 'page')
  return transaction
}

export async function deleteTransaction(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  if ((session.user as any).role !== 'OWNER') throw new Error('Нет прав')

  await prisma.transaction.delete({ where: { id } })
  revalidatePath('/[locale]/finances', 'page')
  revalidatePath('/[locale]/dashboard', 'page')
}
