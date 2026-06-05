import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import styles from '@/components/layout/shell.module.css'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${locale}`)
  }

  const user = {
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: (session.user as any).role ?? 'EMPLOYEE',
  }

  return (
    <div className={styles.shell}>
      <Sidebar user={user} locale={locale} />
      <div className={styles.main}>
        {children}
      </div>
    </div>
  )
}
