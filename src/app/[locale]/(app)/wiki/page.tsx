import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import shellStyles from '@/components/layout/shell.module.css'

export default async function WikiPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  return (
    <div className={shellStyles.content}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>База знаний</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Внутренняя документация и регламенты KAPUSTA.DEV</p>
        </div>
        <button style={{
          background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', 
          padding: '0 16px', height: 36, fontSize: 13, fontWeight: 600, cursor: 'pointer'
        }}>
          Создать статью
        </button>
      </div>
      
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '60px 20px',
        textAlign: 'center',
        color: 'var(--text-3)'
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>База знаний пуста</div>
        <div style={{ fontSize: 13 }}>Здесь будут храниться инструкции, чек-листы и полезные ссылки для команды.</div>
      </div>
    </div>
  )
}
