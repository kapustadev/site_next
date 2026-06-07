'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── PROJECTS ────────────────────────────────────────────────

export async function getProjects() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')

  const role = (session.user as any).role
  const userId = (session.user as any).id

  if (role === 'CLIENT') {
    return prisma.project.findMany({
      where: { clientId: userId },
      include: { manager: true, tasks: true, members: { include: { user: { select: { id: true, name: true, role: true } } } }, client: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  return prisma.project.findMany({
    include: { manager: true, tasks: true, members: { include: { user: { select: { id: true, name: true, role: true } } } }, client: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createProject(data: {
  name: string
  description?: string
  budget?: number
  currency?: string
  deadline?: string
  managerId?: string
  teamMemberIds?: string[]
  clientId?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  const userId = (session.user as any).id

  let budgetPln: number | undefined = undefined
  const currency = data.currency || 'PLN'

  if (data.budget && currency !== 'PLN') {
    const cached = await prisma.exchangeRateCache.findUnique({ where: { currency } })
    const now = Date.now()
    let rate = 1

    if (cached && (now - new Date(cached.fetchedAt).getTime() < 3600000)) {
      rate = cached.rateToPln
    } else {
      try {
        const res = await fetch('https://api.nbp.pl/api/exchangerates/tables/A/?format=json')
        if (res.ok) {
          const json = await res.json()
          const rateObj = json[0].rates.find((r: any) => r.code === currency)
          if (rateObj) {
            rate = rateObj.mid
            await prisma.exchangeRateCache.upsert({
              where: { currency },
              create: { currency, rateToPln: rate, fetchedAt: new Date() },
              update: { rateToPln: rate, fetchedAt: new Date() }
            })
          }
        }
      } catch (e) {
        if (cached) rate = cached.rateToPln
      }
    }
    budgetPln = data.budget * rate
  } else if (data.budget && currency === 'PLN') {
    budgetPln = data.budget
  }

  // Collect unique member IDs (always include creating user)
  const memberIds = Array.from(new Set([
    userId,
    ...(data.managerId ? [data.managerId] : []),
    ...(data.teamMemberIds || []),
  ]))

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      budget: data.budget ? Number(data.budget) : undefined,
      currency: currency as any,
      budgetPln,
      dueDate: data.deadline ? new Date(data.deadline) : undefined,
      managerId: data.managerId || userId,
      clientId: data.clientId || undefined,
      members: {
        create: memberIds.map(id => ({ userId: id }))
      },
      columns: {
        create: [
          { name: 'Backlog', color: '#64748b', order: 0 },
          { name: 'To Do', color: '#3b82f6', order: 1 },
          { name: 'В работе', color: '#f59e0b', order: 2, notifyClient: true },
          { name: 'Ревью', color: '#8b5cf6', order: 3 },
          { name: 'Тестирование', color: '#06b6d4', order: 4 },
          { name: 'Готово', color: '#22c55e', order: 5, notifyClient: true },
        ]
      }
    },
    include: { manager: true, tasks: true, members: { include: { user: { select: { id: true, name: true, role: true } } } }, client: true, columns: true }
  })

  // Automatically create a ChatGroup if there's a client
  if (data.clientId) {
    const chatMemberIds = Array.from(new Set([
      userId,
      ...(data.managerId ? [data.managerId] : []),
      data.clientId,
      ...(data.teamMemberIds || []),
    ]))
    
    await prisma.chatGroup.create({
      data: {
        name: `Проект: ${project.name}`,
        projectId: project.id,
        isDirect: false,
        members: {
          create: chatMemberIds.map(id => ({ userId: id }))
        }
      }
    })
  }

  revalidatePath('/[locale]/projects', 'page')
  return project
}

export async function deleteProject(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  await prisma.project.delete({ where: { id } })
  revalidatePath('/[locale]/projects', 'page')
}

// ─── TASKS ────────────────────────────────────────────────────

export async function getTasksByProject(projectId: string) {
  return prisma.task.findMany({
    where: { projectId },
    include: { assignee: true, comments: { include: { author: true } } },
    orderBy: { createdAt: 'asc' }
  })
}

export async function createTask(data: {
  title: string
  description?: string
  projectId: string
  assigneeId?: string
  dueDate?: string
  columnId?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role === 'CLIENT') throw new Error('Нет прав')

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      assigneeId: data.assigneeId || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      columnId: data.columnId || null,
    }
  })

  revalidatePath(`/[locale]/projects/${data.projectId}`, 'page')
  return task
}

export async function updateTaskColumn(taskId: string, columnId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role === 'CLIENT') throw new Error('Нет прав')

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { columnId }
  })

  revalidatePath(`/[locale]/projects/${task.projectId}`, 'page')
  return task
}

export async function deleteTask(taskId: string, projectId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')

  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath(`/[locale]/projects/${projectId}`, 'page')
}

// ─── USERS (for OWNER) ─────────────────────────────────────────

export async function getUsers() {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER') throw new Error('Нет прав')

  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function createUser(data: {
  name: string
  email: string
  role: string
  password: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER') throw new Error('Нет прав')

  const bcrypt = await import('bcryptjs')
  const passwordHash = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role as any,
      passwordHash,
    }
  })

  revalidatePath('/[locale]/admin/users', 'page')
  return { ...user, passwordHash: undefined }
}

export async function updateUserRole(userId: string, role: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  if ((session.user as any).role !== 'OWNER') throw new Error('Нет прав')

  await prisma.user.update({ where: { id: userId }, data: { role: role as any } })
  revalidatePath('/[locale]/admin/users', 'page')
}

export async function updateUser(userId: string, data: {
  name: string
  email: string
  role: string
  password?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  if ((session.user as any).role !== 'OWNER') throw new Error('Нет прав')

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role as any,
  }

  if (data.password && data.password.length >= 6) {
    const bcrypt = await import('bcryptjs')
    updateData.passwordHash = await bcrypt.hash(data.password, 12)
  } else if (data.password && data.password.length > 0) {
    throw new Error('Пароль должен содержать минимум 6 символов')
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  revalidatePath('/[locale]/admin/users', 'page')
  return { ...user, passwordHash: undefined }
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  if ((session.user as any).role !== 'OWNER') throw new Error('Нет прав')

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/[locale]/admin/users', 'page')
}
