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
  description?: string
  category?: string
  amount: number
  projectId?: string
  date?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  if ((session.user as any).role !== 'OWNER') throw new Error('Нет прав')

  const transaction = await prisma.transaction.create({
    data: {
      type: data.type,
      description: data.description,
      category: data.category || 'General',
      amount: data.amount,
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
