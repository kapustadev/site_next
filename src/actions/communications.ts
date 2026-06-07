'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── CHAT ──────────────────────────────────────────────────

export async function getChatGroups() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const userId = (session.user as any).id

  return prisma.chatGroup.findMany({
    where: {
      members: { some: { userId } }
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, role: true } } }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'asc' }
  })
}

export async function getMessages(groupId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const userId = (session.user as any).id

  const member = await prisma.chatMember.findUnique({
    where: { userId_groupId: { groupId, userId } }
  })
  if (!member) throw new Error('Нет доступа к этой группе')

  return prisma.message.findMany({
    where: { groupId },
    orderBy: { createdAt: 'asc' },
    take: 100,
    include: {
      author: { select: { id: true, name: true, role: true } }
    }
  })
}

export async function sendMessage(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const userId = (session.user as any).id

  const groupId = formData.get('groupId') as string
  const content = formData.get('content') as string

  if (!groupId) throw new Error('Нет ID группы')
  if (!content) throw new Error('Сообщение пустое')

  const member = await prisma.chatMember.findUnique({
    where: { userId_groupId: { groupId, userId } }
  })
  if (!member) throw new Error('Нет доступа')

  const msg = await prisma.message.create({
    data: {
      groupId,
      authorId: userId,
      content: content
    },
    include: {
      author: { select: { id: true, name: true, role: true } }
    }
  })

  revalidatePath('/[locale]/chat', 'page')
  return msg
}

export async function createChatGroup(name: string, userIds: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав на создание групп')

  const userId = (session.user as any).id
  const members = Array.from(new Set([...userIds, userId]))

  const group = await prisma.chatGroup.create({
    data: {
      name,
      isDirect: false,
      members: {
        create: members.map(id => ({ userId: id }))
      }
    }
  })

  revalidatePath('/[locale]/chat', 'page')
  return group
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
