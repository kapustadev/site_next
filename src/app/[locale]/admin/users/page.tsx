import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/ru')
  if ((session.user as any).role !== 'OWNER') redirect('/ru/dashboard')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <h1>Управление пользователями (в разработке)</h1>
    </div>
  )
}
