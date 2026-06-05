import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getPlugins, getPluginCategories } from '@/actions/plugins'
import PluginsClient from './PluginsClient'
import shellStyles from '@/components/layout/shell.module.css'

export default async function PluginsPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  
  if (!session?.user) redirect(`/${locale}`)
  
  const role = (session.user as any).role
  if (role === 'CLIENT') {
    redirect(`/${locale}/dashboard`)
  }

  const plugins = await getPlugins()
  const categories = await getPluginCategories()

  return (
    <div className={shellStyles.content}>
      <PluginsClient plugins={plugins} categories={categories} role={role} />
    </div>
  )
}
