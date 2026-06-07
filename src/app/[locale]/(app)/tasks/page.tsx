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
                      {task.column ? (
                        <span style={{
                          background: task.column.color + '20', padding: '4px 10px', borderRadius: 99,
                          fontSize: 11, fontWeight: 700, color: task.column.color
                        }}>
                          {task.column.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-3)', fontSize: 11 }}>—</span>
                      )}
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
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Услуга</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Тип</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Сумма</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Сл. оплата</th>
                  {role !== 'CLIENT' && <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase' }}>Клиент</th>}
                </tr>
              </thead>
              <tbody>
                {upcomingServices.map(s => {
                  const isOverdue = new Date(s.nextDueDate) < new Date()
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, fontSize: 14 }}>{s.name}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          background: s.type === 'HOSTING' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: s.type === 'HOSTING' ? '#c4b5fd' : '#6ee7b7',
                          padding: '4px 8px', borderRadius: 4, fontSize: 11, textTransform: 'uppercase'
                        }}>
                          {s.type}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700 }}>
                        {s.price.toLocaleString('pl-PL')} {s.currency} <span style={{fontSize: 11, color: 'var(--text-3)', fontWeight: 400}}>/ {s.billingCycle === 'YEARLY' ? 'год' : 'мес'}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: isOverdue ? '#ef4444' : 'var(--text-1)', fontWeight: isOverdue ? 600 : 400 }}>
                        {new Date(s.nextDueDate).toLocaleDateString('ru-RU')}
                      </td>
                      {role !== 'CLIENT' && (
                        <td style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-2)' }}>
                          {s.client.name}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
