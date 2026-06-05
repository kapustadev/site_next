import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}`)
  }

  const role = (session.user as any).role

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font)'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em' }}>
        Добро пожаловать, {session.user.name}! 👋
      </h1>
      <p style={{ color: 'var(--text-2)', fontSize: '16px' }}>
        Роль: <strong style={{ color: 'var(--blue)' }}>{role}</strong>
      </p>
      <p style={{ color: 'var(--text-3)' }}>Дашборд строится — скоро здесь будет всё 🚀</p>
    </div>
  )
}
