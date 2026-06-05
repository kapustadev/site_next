import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ClientShell from '@/components/layout/ClientShell'

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
    <ClientShell user={user} locale={locale}>
      {children}
    </ClientShell>
  )
}
