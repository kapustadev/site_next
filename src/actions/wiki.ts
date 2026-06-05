'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getWikiArticles() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')

  return prisma.wikiArticle.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true, role: true } } }
  })
}

export async function createWikiArticle(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') {
    throw new Error('Только Владелец и ПМ могут создавать статьи')
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const userId = (session.user as any).id

  if (!title || !content) throw new Error('Заполните все поля')

  await prisma.wikiArticle.create({
    data: {
      title,
      content,
      authorId: userId
    }
  })

  revalidatePath('/[locale]/wiki', 'page')
}

export async function deleteWikiArticle(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') {
    throw new Error('Нет прав на удаление')
  }

  await prisma.wikiArticle.delete({ where: { id } })
  revalidatePath('/[locale]/wiki', 'page')
}
