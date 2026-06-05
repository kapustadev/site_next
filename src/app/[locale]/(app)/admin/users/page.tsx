import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import shellStyles from '@/components/layout/shell.module.css'
import UsersClient from './UsersClient'

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)
  if ((session.user as any).role !== 'OWNER') redirect(`/${locale}/dashboard`)

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  })

  return (
    <div className={shellStyles.content}>
      <UsersClient users={users as any} locale={locale} currentUserId={(session.user as any).id} />
    </div>
  )
}
