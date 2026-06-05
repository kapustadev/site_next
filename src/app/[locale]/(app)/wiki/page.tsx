import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getWikiArticles } from '@/actions/wiki'
import shellStyles from '@/components/layout/shell.module.css'
import WikiClient from './WikiClient'

export default async function WikiPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  const role = (session.user as any).role
  const articles = await getWikiArticles()

  return (
    <div className={shellStyles.content} style={{ padding: '16px' }}>
      <WikiClient articles={articles} role={role} />
    </div>
  )
}
