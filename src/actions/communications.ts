'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── CHAT ──────────────────────────────────────────────────

export async function getMessages() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')

  return prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      author: { select: { id: true, name: true, role: true } }
    }
  })
}

export async function sendMessage(content: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  
  const userId = (session.user as any).id

  const msg = await prisma.message.create({
    data: {
      content,
      authorId: userId
    },
    include: {
      author: { select: { id: true, name: true, role: true } }
    }
  })

  revalidatePath('/[locale]/chat', 'page')
  return msg
}

// ─── COMMENTS ──────────────────────────────────────────────

export async function addComment(taskId: string, content: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')

  const userId = (session.user as any).id

  const comment = await prisma.comment.create({
    data: {
      taskId,
      content,
      authorId: userId
    },
    include: {
      author: { select: { id: true, name: true, role: true } }
    }
  })

  // We revalidate the project page where the task board lives
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (task) {
    revalidatePath(`/[locale]/projects/${task.projectId}`, 'page')
  }
  
  return comment
}

export async function deleteComment(commentId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const comment = await prisma.comment.findUnique({ where: { id: commentId }, include: { task: true } })
  if (!comment) return

  if (comment.authorId !== userId && role !== 'OWNER' && role !== 'PM') {
    throw new Error('Нет прав на удаление')
  }

  await prisma.comment.delete({ where: { id: commentId } })
  revalidatePath(`/[locale]/projects/${comment.task.projectId}`, 'page')
}
