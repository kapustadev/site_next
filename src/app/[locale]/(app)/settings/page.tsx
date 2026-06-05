import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import shellStyles from '@/components/layout/shell.module.css'

export default async function SettingsPage({
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
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Настройки</h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Управление вашим профилем и настройками системы.</p>
      </div>
      
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Мой профиль</div>
        
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700
          }}>
            {session.user.name ? session.user.name[0].toUpperCase() : '?'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{session.user.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{session.user.email}</div>
          </div>
        </div>

        <div style={{ marginTop: 24, fontSize: 15, fontWeight: 600, color: 'var(--text)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>Уведомления и Внешний вид</div>
        
        <div style={{ fontSize: 13, color: 'var(--text-3)', padding: '20px 0', textAlign: 'center' }}>
          Настройки уведомлений и кастомизации будут доступны в следующих обновлениях.
        </div>
      </div>
    </div>
  )
}
