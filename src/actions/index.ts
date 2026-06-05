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
    // Client sees only projects where they are the manager (placeholder — later link clients to projects)
    return prisma.project.findMany({
      include: { manager: true, tasks: true },
      orderBy: { createdAt: 'desc' }
    })
  }

  return prisma.project.findMany({
    include: { manager: true, tasks: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createProject(data: {
  name: string
  description?: string
  budget?: number
  deadline?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role !== 'OWNER' && role !== 'PM') throw new Error('Нет прав')

  const userId = (session.user as any).id

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      budget: data.budget ? Number(data.budget) : undefined,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      managerId: userId,
    }
  })

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
  status?: string
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
      status: (data.status as any) ?? 'TODO',
    }
  })

  revalidatePath(`/[locale]/projects/${data.projectId}`, 'page')
  return task
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  const role = (session.user as any).role
  if (role === 'CLIENT') throw new Error('Нет прав')

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: status as any }
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

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  if ((session.user as any).role !== 'OWNER') throw new Error('Нет прав')

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath('/[locale]/admin/users', 'page')
}
