import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import shellStyles from '@/components/layout/shell.module.css'
import FinancesClient from './FinancesClient'

export default async function FinancesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)
  if ((session.user as any).role !== 'OWNER') redirect(`/${locale}/dashboard`)

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: 'desc' },
    include: { project: { select: { name: true } } }
  })

  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })

  return (
    <div className={shellStyles.content}>
      <FinancesClient transactions={transactions as any} projects={projects} />
    </div>
  )
}
