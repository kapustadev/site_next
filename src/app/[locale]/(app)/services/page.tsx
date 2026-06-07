import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getServices } from '@/actions/services'
import shellStyles from '@/components/layout/shell.module.css'
import ServicesClient from './ServicesClient'

export const metadata = {
  title: 'Хостинг и Домены | Studio Flow',
}

export default async function ServicesPage() {
  const session = await auth()
  if (!session?.user) return null

  const role = (session.user as any).role
  const canEdit = role === 'OWNER' || role === 'PM'
  
  const services = await getServices()
  
  const clients = canEdit ? await prisma.user.findMany({ where: { role: 'CLIENT' } }) : []
  const projects = await prisma.project.findMany({ select: { id: true, name: true } })

  return (
    <div className={shellStyles.content}>
      <ServicesClient 
        services={services} 
        canEdit={canEdit} 
        clients={clients} 
        projects={projects}
      />
    </div>
  )
}
