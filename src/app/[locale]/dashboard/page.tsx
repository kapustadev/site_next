import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/ru')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800 }}>
        Добро пожаловать, {session.user.name}! 👋
      </h1>
      <p style={{ color: 'var(--text-2)' }}>Дашборд в разработке — скоро здесь будет магия.</p>
    </div>
  )
}
