'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { put, del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'

// Restrict access to developers/managers
async function checkAccess() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role === 'CLIENT') throw new Error('Нет прав для доступа к плагинам')
  return (session.user as any).id
}

export async function getPlugins() {
  await checkAccess()
  return prisma.plugin.findMany({
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { name: true } } }
  })
}

export async function uploadPlugin(formData: FormData) {
  const userId = await checkAccess()
  
  const name = formData.get('name') as string
  const version = formData.get('version') as string
  const description = formData.get('description') as string
  const file = formData.get('file') as File

  if (!file) throw new Error('Файл не выбран')
  if (!file.name.endsWith('.zip')) throw new Error('Разрешены только .zip архивы')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('В переменные окружения не добавлен BLOB_READ_WRITE_TOKEN. Создайте хранилище Vercel Blob.')
  }

  let blobUrl = ''
  try {
    const blob = await put(`plugins/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN
    })
    blobUrl = blob.url
  } catch (error: any) {
    console.error('Blob upload error:', error)
    throw new Error('Ошибка загрузки файла в Vercel Blob: ' + error.message)
  }

  // Save to DB
  const plugin = await prisma.plugin.create({
    data: {
      name,
      version,
      description,
      fileUrl: blobUrl,
      uploaderId: userId,
    }
  })

  revalidatePath('/[locale]/plugins', 'page')
  return plugin
}

export async function deletePlugin(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Только Владелец или ПМ могут удалять плагины')

  const plugin = await prisma.plugin.findUnique({ where: { id } })
  if (!plugin) return

  // Delete from Vercel Blob
  try {
    await del(plugin.fileUrl)
  } catch (e) {
    console.error('Failed to delete blob', e)
  }

  // Delete from DB
  await prisma.plugin.delete({ where: { id } })
  revalidatePath('/[locale]/plugins', 'page')
}
