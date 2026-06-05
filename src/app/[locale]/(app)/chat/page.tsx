import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getChatGroups } from '@/actions/communications'
import { prisma } from '@/lib/prisma'
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

  const userId = (session.user as any).id
  const role = (session.user as any).role

  const groups = await getChatGroups()
  
  // Для создания групп получаем пользователей (только для PM и OWNER)
  let allUsers: any[] = []
  if (role === 'OWNER' || role === 'PM') {
    allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    })
  }

  return (
    <div className={shellStyles.content} style={{ padding: '16px' }}>
      <ChatClient groups={groups as any} currentUserId={userId} allUsers={allUsers} role={role} />
    </div>
  )
}
