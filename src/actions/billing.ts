'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── GET INVOICES (for current client) ────────────────────
export async function getMyInvoices() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const userId = (session.user as any).id

  return prisma.invoice.findMany({
    where: { clientId: userId },
    include: { project: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  })
}

// ─── GET ALL INVOICES (for OWNER/PM) ──────────────────────
export async function getAllInvoices() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  return prisma.invoice.findMany({
    include: {
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ─── CREATE INVOICE ────────────────────────────────────────
export async function createInvoice(data: { projectId: string; clientId: string; amount: number; status?: string; description?: string; dueDate?: string; }) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  const invoice = await prisma.invoice.create({
    data: {
      projectId: data.projectId,
      clientId: data.clientId,
      amount: data.amount,
      status: (data.status as any) || 'PENDING',
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: {
      project: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, email: true } }
    }
  })

  revalidatePath('/[locale]/billing', 'page')
  revalidatePath('/[locale]/finances', 'page')
  return invoice
}

// ─── UPDATE INVOICE STATUS ─────────────────────────────────
export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  const data: any = { status }

  await prisma.invoice.update({ where: { id: invoiceId }, data })
  revalidatePath('/[locale]/billing', 'page')
  revalidatePath('/[locale]/finances', 'page')
}

// ─── DELETE INVOICE ────────────────────────────────────────
export async function deleteInvoice(invoiceId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER') throw new Error('Нет прав')

  await prisma.invoice.delete({ where: { id: invoiceId } })
  revalidatePath('/[locale]/billing', 'page')
}
