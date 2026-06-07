'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function checkAccess(projectId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав для управления колонками')
  return (session.user as any).id
}

export async function createKanbanColumn(projectId: string, data: { name: string; color: string; notifyClient: boolean }) {
  await checkAccess(projectId)
  
  const count = await prisma.kanbanColumn.count({ where: { projectId } })
  const col = await prisma.kanbanColumn.create({
    data: {
      projectId,
      name: data.name,
      color: data.color,
      notifyClient: data.notifyClient,
      order: count
    }
  })
  
  revalidatePath(`/[locale]/projects/${projectId}`, 'page')
  return col
}

export async function updateKanbanColumn(id: string, projectId: string, data: { name?: string; color?: string; notifyClient?: boolean; order?: number }) {
  await checkAccess(projectId)
  
  const col = await prisma.kanbanColumn.update({
    where: { id },
    data
  })
  
  revalidatePath(`/[locale]/projects/${projectId}`, 'page')
  return col
}

export async function deleteKanbanColumn(id: string, projectId: string) {
  await checkAccess(projectId)
  
  await prisma.kanbanColumn.delete({ where: { id } })
  revalidatePath(`/[locale]/projects/${projectId}`, 'page')
}

// Отправка автоматического сообщения в проектный чат (при смене статуса задачи)
export async function sendProjectStatusMessage(projectId: string, messageContent: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const userId = (session.user as any).id
  
  // Найти чат-группу, привязанную к этому проекту
  const chatGroup = await prisma.chatGroup.findFirst({
    where: { projectId }
  })
  
  if (!chatGroup) return { error: 'Чат для проекта не найден' }
  
  // Убедиться, что пользователь состоит в этом чате (или добавить его)
  const member = await prisma.chatMember.findUnique({
    where: { userId_groupId: { userId, groupId: chatGroup.id } }
  })
  
  if (!member) {
    await prisma.chatMember.create({
      data: { userId, groupId: chatGroup.id }
    })
  }

  // Создать сообщение
  const message = await prisma.message.create({
    data: {
      content: messageContent,
      authorId: userId,
      groupId: chatGroup.id
    }
  })
  
  return message
}
