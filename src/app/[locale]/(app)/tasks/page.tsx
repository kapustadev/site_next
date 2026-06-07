import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import shellStyles from '@/components/layout/shell.module.css'
import styles from './tasks.module.css'

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
    include: { project: true, column: true },
    orderBy: { dueDate: 'asc' }
  })

  const role = (session.user as any).role
  const upcomingServices = role === 'CLIENT'
    ? await prisma.serviceSubscription.findMany({
        where: { clientId: userId },
        include: { client: true, project: true },
        orderBy: { nextDueDate: 'asc' }
      })
    : await prisma.serviceSubscription.findMany({
        include: { client: true, project: true },
        orderBy: { nextDueDate: 'asc' }
      })

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
        <div className={styles.responsiveTableWrapper}>
          <table className={styles.responsiveTable}>
            <thead>
              <tr>
                <th>Задача</th>
                <th>Проект</th>
                <th>Статус</th>
                <th>Дедлайн</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td data-label="Задача" className={styles.tdTitle}>
                    <Link href={`/${locale}/projects/${task.projectId}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                      {task.title}
                    </Link>
                  </td>
                  <td data-label="Проект" style={{ color: 'var(--text-2)' }}>
                    {task.project.name}
                  </td>
                  <td data-label="Статус">
                    {task.column ? (
                      <span className={styles.tdBadge} style={{
                        background: task.column.color + '20', color: task.column.color
                      }}>
                        {task.column.name}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-3)' }}>—</span>
                    )}
                  </td>
                  <td data-label="Дедлайн" style={{ color: task.dueDate && new Date(task.dueDate) < new Date() ? 'var(--red)' : 'var(--text-2)' }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ru') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Предстоящие платежи */}
      <div style={{ marginTop: 40, marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Предстоящие платежи (Услуги)</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
          {role === 'CLIENT' ? 'Ваши регулярные подписки и услуги' : 'Регулярные платежи клиентов'}
        </p>
      </div>

      {upcomingServices.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)'
        }}>
          <div style={{ fontSize: 14 }}>Нет предстоящих платежей по услугам</div>
        </div>
      ) : (
        <div className={styles.responsiveTableWrapper}>
          <table className={styles.responsiveTable}>
            <thead>
              <tr>
                <th>Услуга</th>
                <th>Тип</th>
                <th>Сумма</th>
                <th>Сл. оплата</th>
                {role !== 'CLIENT' && <th>Клиент</th>}
              </tr>
            </thead>
            <tbody>
              {upcomingServices.map(s => {
                const isOverdue = new Date(s.nextDueDate) < new Date()
                return (
                  <tr key={s.id}>
                    <td data-label="Услуга" className={styles.tdTitle}>{s.name}</td>
                    <td data-label="Тип">
                      <span className={styles.tdBadge} style={{
                        background: s.type === 'HOSTING' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: s.type === 'HOSTING' ? '#c4b5fd' : '#6ee7b7'
                      }}>
                        {s.type}
                      </span>
                    </td>
                    <td data-label="Сумма" style={{ fontWeight: 700 }}>
                      {s.price.toLocaleString('pl-PL')} {s.currency} <span style={{fontSize: 11, color: 'var(--text-3)', fontWeight: 400}}>/ {s.billingCycle === 'YEARLY' ? 'год' : 'мес'}</span>
                    </td>
                    <td data-label="Сл. оплата" style={{ color: isOverdue ? '#ef4444' : 'var(--text-1)', fontWeight: isOverdue ? 600 : 400 }}>
                      {new Date(s.nextDueDate).toLocaleDateString('ru-RU')}
                    </td>
                    {role !== 'CLIENT' && (
                      <td data-label="Клиент" style={{ color: 'var(--text-2)' }}>
                        {s.client.name}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
