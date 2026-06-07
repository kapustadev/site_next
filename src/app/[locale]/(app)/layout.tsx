import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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

  const userId = (session.user as any).id
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, role: true, avatarUrl: true }
  })

  if (!dbUser) {
    redirect(`/${locale}`)
  }

  const user = {
    name: dbUser.name ?? null,
    email: dbUser.email ?? null,
    role: dbUser.role ?? 'EMPLOYEE',
    avatarUrl: dbUser.avatarUrl ?? null,
  }

  return (
    <ClientShell user={user} locale={locale}>
      {children}
    </ClientShell>
  )
}
