import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import shellStyles from '@/components/layout/shell.module.css'

export default async function TasksPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  const userId = (session.user as any).id
  
  const tasks = await prisma.task.findMany({
    where: { assigneeId: userId },
    include: { project: true },
    orderBy: { dueDate: 'asc' }
  })

  const statusColors: Record<string, string> = {
    BACKLOG: 'rgba(255,255,255,0.1)',
    TODO: 'rgba(245, 158, 11, 0.15)',
    IN_PROGRESS: 'rgba(1, 14, 208, 0.15)',
    REVIEW: 'rgba(168, 85, 247, 0.15)',
    TESTING: 'rgba(236, 72, 153, 0.15)',
    DONE: 'rgba(34, 197, 94, 0.15)',
  }

  const statusLabels: Record<string, string> = {
    BACKLOG: 'Бэклог',
    TODO: 'К выполнению',
    IN_PROGRESS: 'В работе',
    REVIEW: 'Ревью',
    TESTING: 'Тестирование',
    DONE: 'Готово',
  }

  return (
    <div className={shellStyles.content}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Мои задачи</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
          {tasks.length} задач привязано к вашему аккаунту
        </p>
      </div>
      
      {tasks.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '60px 20px', textAlign: 'center', color: 'var(--text-3)'
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏖️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Нет активных задач</div>
          <div style={{ fontSize: 13 }}>Отдыхайте, пока менеджер не назначит вам новую работу.</div>
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Задача</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Проект</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Статус</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Дедлайн</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <Link href={`/${locale}/projects/${task.projectId}`} style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: 14, display: 'block' }}>
                        {task.title}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)' }}>
                      {task.project.name}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        background: statusColors[task.status], padding: '4px 10px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700, color: 'var(--text)'
                      }}>
                        {statusLabels[task.status]}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: task.dueDate && new Date(task.dueDate) < new Date() ? 'var(--red)' : 'var(--text-2)' }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
