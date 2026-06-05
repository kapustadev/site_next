import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import shellStyles from '@/components/layout/shell.module.css'
import KanbanBoard from './KanbanBoard'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  const role = (session.user as any).role

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      manager: true,
      tasks: {
        include: { 
          assignee: true,
          comments: {
            include: { author: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!project) notFound()

  const users = role === 'OWNER' || role === 'PM'
    ? await prisma.user.findMany({ select: { id: true, name: true, role: true } })
    : []

  const canEdit = role === 'OWNER' || role === 'PM' || role === 'EMPLOYEE'
  const isReadOnly = role === 'CLIENT'

  return (
    <div className={shellStyles.content} style={{ padding: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <KanbanBoard
        project={project as any}
        locale={locale}
        users={users}
        canEdit={canEdit}
        isReadOnly={isReadOnly}
        currentUserId={(session.user as any).id}
      />
    </div>
  )
}
