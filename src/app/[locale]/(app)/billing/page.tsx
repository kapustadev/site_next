import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getMyInvoices, getAllInvoices } from '@/actions/billing'
import shellStyles from '@/components/layout/shell.module.css'
import BillingClient from './BillingClient'

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  const role = (session.user as any).role
  const isOwnerOrPm = role === 'OWNER' || role === 'PM'

  const invoices = isOwnerOrPm ? await getAllInvoices() : await getMyInvoices()

  return (
    <div className={shellStyles.content}>
      <BillingClient invoices={invoices as any} isOwnerOrPm={isOwnerOrPm} />
    </div>
  )
}
