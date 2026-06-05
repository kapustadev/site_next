'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Не авторизован')
  
  const userId = (session.user as any).id
  const name = formData.get('name') as string
  const password = formData.get('password') as string

  if (!name) throw new Error('Имя не может быть пустым')

  const updateData: any = { name }

  if (password && password.length >= 6) {
    updateData.passwordHash = await bcrypt.hash(password, 10)
  } else if (password) {
    throw new Error('Пароль должен содержать минимум 6 символов')
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData
  })

  revalidatePath('/[locale]/settings', 'page')
}
