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
  return { userId: (session.user as any).id, role }
}

export async function getPluginCategories() {
  await checkAccess()
  return prisma.pluginCategory.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createPluginCategory(name: string) {
  const { role } = await checkAccess()
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав на создание категорий')
  
  if (!name.trim()) return { error: 'Название не может быть пустым' }
  
  try {
    const category = await prisma.pluginCategory.create({
      data: { name: name.trim() }
    })
    revalidatePath('/[locale]/plugins', 'page')
    return category
  } catch (err: any) {
    return { error: 'Категория с таким именем уже существует' }
  }
}

export async function deletePluginCategory(id: string) {
  const { role } = await checkAccess()
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')
  
  await prisma.pluginCategory.delete({ where: { id } })
  revalidatePath('/[locale]/plugins', 'page')
}

export async function getPlugins() {
  await checkAccess()
  return prisma.plugin.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      category: { select: { name: true } },
      versions: {
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { name: true } } }
      }
    }
  })
}

export async function uploadPlugin(formData: FormData) {
  let userId, role;
  try {
    const access = await checkAccess()
    userId = access.userId
    role = access.role
  } catch (err: any) {
    return { error: err.message }
  }
  
  if (role !== 'OWNER' && role !== 'PM') {
    return { error: 'У вас нет прав на загрузку плагинов. Только Владелец или PM.' }
  }
  
  const name = formData.get('name') as string
  const version = formData.get('version') as string
  const description = formData.get('description') as string
  const categoryId = formData.get('categoryId') as string
  const file = formData.get('file') as File

  if (!file) return { error: 'Файл не выбран' }
  if (!file.name.endsWith('.zip')) return { error: 'Разрешены только .zip архивы' }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: 'В переменные окружения не добавлен BLOB_READ_WRITE_TOKEN. Создайте хранилище Vercel Blob.' }
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
    return { error: 'Ошибка загрузки файла в Vercel Blob: ' + error.message }
  }

  // Create Plugin + PluginVersion
  const plugin = await prisma.plugin.create({
    data: {
      name,
      description,
      categoryId: categoryId || null,
      versions: {
        create: {
          version,
          fileUrl: blobUrl,
          uploaderId: userId,
        }
      }
    },
    include: {
      category: { select: { name: true } },
      versions: {
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { name: true } } }
      }
    }
  })

  revalidatePath('/[locale]/plugins', 'page')
  return plugin
}

export async function uploadPluginVersion(formData: FormData) {
  let userId, role;
  try {
    const access = await checkAccess()
    userId = access.userId
    role = access.role
  } catch (err: any) {
    return { error: err.message }
  }
  
  if (role !== 'OWNER' && role !== 'PM') {
    return { error: 'У вас нет прав на загрузку плагинов. Только Владелец или PM.' }
  }
  
  const pluginId = formData.get('pluginId') as string
  const version = formData.get('version') as string
  const file = formData.get('file') as File

  if (!pluginId || !version) return { error: 'Не указан плагин или версия' }
  if (!file) return { error: 'Файл не выбран' }
  if (!file.name.endsWith('.zip')) return { error: 'Разрешены только .zip архивы' }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: 'В переменные окружения не добавлен BLOB_READ_WRITE_TOKEN. Создайте хранилище Vercel Blob.' }
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
    return { error: 'Ошибка загрузки файла в Vercel Blob: ' + error.message }
  }

  const pluginVersion = await prisma.pluginVersion.create({
    data: {
      version,
      fileUrl: blobUrl,
      uploaderId: userId,
      pluginId,
    },
    include: { uploader: { select: { name: true } } }
  })

  revalidatePath('/[locale]/plugins', 'page')
  return pluginVersion
}

export async function deletePlugin(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Только Владелец или ПМ могут удалять плагины')

  const plugin = await prisma.plugin.findUnique({ where: { id }, include: { versions: true } })
  if (!plugin) return

  // Delete all versions from Vercel Blob
  for (const v of plugin.versions) {
    try {
      await del(v.fileUrl)
    } catch (e) {
      console.error('Failed to delete blob', e)
    }
  }

  // Delete from DB
  await prisma.plugin.delete({ where: { id } })
  revalidatePath('/[locale]/plugins', 'page')
}
