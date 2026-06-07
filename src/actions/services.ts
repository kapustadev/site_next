'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ServiceType, BillingCycle, Currency } from '@prisma/client'

export async function getServices() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')

  const role = (session.user as any).role
  const userId = (session.user as any).id

  if (role === 'CLIENT') {
    return prisma.serviceSubscription.findMany({
      where: { clientId: userId },
      include: { client: { select: { id: true, name: true, email: true } }, project: true },
      orderBy: { nextDueDate: 'asc' }
    })
  }

  return prisma.serviceSubscription.findMany({
    include: { client: { select: { id: true, name: true, email: true } }, project: true },
    orderBy: { nextDueDate: 'asc' }
  })
}

export async function createService(data: {
  name: string
  type: ServiceType
  price: number
  currency: Currency
  billingCycle: BillingCycle
  nextDueDate: string
  clientId: string
  projectId?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  const service = await prisma.serviceSubscription.create({
    data: {
      name: data.name,
      type: data.type,
      price: data.price,
      currency: data.currency,
      billingCycle: data.billingCycle,
      nextDueDate: new Date(data.nextDueDate),
      clientId: data.clientId,
      projectId: data.projectId || undefined,
    }
  })

  revalidatePath('/[locale]/services', 'page')
  revalidatePath('/[locale]/tasks', 'page') // for upcoming payments
  return service
}

export async function updateService(id: string, data: {
  name: string
  type: ServiceType
  price: number
  currency: Currency
  billingCycle: BillingCycle
  nextDueDate: string
  clientId: string
  projectId?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  const service = await prisma.serviceSubscription.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
      price: data.price,
      currency: data.currency,
      billingCycle: data.billingCycle,
      nextDueDate: new Date(data.nextDueDate),
      clientId: data.clientId,
      projectId: data.projectId || undefined,
    }
  })

  revalidatePath('/[locale]/services', 'page')
  revalidatePath('/[locale]/tasks', 'page')
  return service
}

export async function deleteService(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  await prisma.serviceSubscription.delete({ where: { id } })
  revalidatePath('/[locale]/services', 'page')
  revalidatePath('/[locale]/tasks', 'page')
}
