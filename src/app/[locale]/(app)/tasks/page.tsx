import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import shellStyles from '@/components/layout/shell.module.css'

export default async function TasksPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  return (
    <div className={shellStyles.content}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Мои задачи</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Список всех задач, привязанных к вашему аккаунту.</p>
      </div>
      
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'var(--text-3)'
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Раздел в разработке</div>
        <div style={{ fontSize: 13 }}>Здесь будет отображаться сводная таблица всех ваших задач по проектам.</div>
      </div>
    </div>
  )
}
