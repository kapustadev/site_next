import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getMessages } from '@/actions/communications'
import shellStyles from '@/components/layout/shell.module.css'
import ChatClient from './ChatClient'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  const messages = await getMessages()
  const userId = (session.user as any).id

  return (
    <div className={shellStyles.content}>
      <ChatClient messages={messages as any} currentUserId={userId} />
    </div>
  )
}
