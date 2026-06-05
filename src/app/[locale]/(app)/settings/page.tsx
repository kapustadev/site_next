import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import shellStyles from '@/components/layout/shell.module.css'
import SettingsClient from './SettingsClient'

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
      
      <SettingsClient user={session.user} />
    </div>
  )
}
