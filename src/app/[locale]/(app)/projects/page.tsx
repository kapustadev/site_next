import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import styles from './projects.module.css'
import shellStyles from '@/components/layout/shell.module.css'
import ProjectsClient from './ProjectsClient'

const PROJECT_COLORS = ['#010ED0', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  const role = (session.user as any).role
  const userId = (session.user as any).id

  const projects = await prisma.project.findMany({
    include: { manager: true, tasks: true },
    orderBy: { createdAt: 'desc' }
  })

  // Only owners and PMs can create projects, so we only need users for them
  let users: any[] = []
  if (role === 'OWNER' || role === 'PM') {
    users = await prisma.user.findMany({
      select: { id: true, name: true, role: true, email: true },
      orderBy: { name: 'asc' }
    })
  }

  const canCreate = role === 'OWNER' || role === 'PM'

  return (
    <div className={shellStyles.content}>
      <ProjectsClient
        projects={projects as any}
        locale={locale}
        canCreate={role === 'OWNER' || role === 'PM'}
        colors={PROJECT_COLORS}
        role={role}
        users={users}
        currentUserId={userId}
      />
    </div>
  )
}
