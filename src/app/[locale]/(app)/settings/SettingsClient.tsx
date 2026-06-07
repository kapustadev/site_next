'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/actions/settings'
import styles from './settings.module.css'

export default function SettingsClient({ user }: { user: any }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState({ text: '', type: '' })

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setMsg({ text: '', type: '' })
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        await updateProfile(formData)
        setMsg({ text: 'Профиль успешно обновлен', type: 'success' })
        // Очищаем поле пароля после успеха
        ;(e.target as HTMLFormElement).reset()
        // Восстанавливаем имя в инпуте
        const nameInput = (e.target as HTMLFormElement).elements.namedItem('name') as HTMLInputElement
        nameInput.value = formData.get('name') as string
      } catch (err: any) {
        setMsg({ text: err.message, type: 'error' })
      }
    })
  }

  return (
    <div className={styles.settingsLayout}>
      <div className={styles.settingsCard}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              user.name ? user.name[0].toUpperCase() : '?'
            )}
          </div>
          <div>
            <div className={styles.name}>{user.name}</div>
            <div className={styles.email}>{user.email}</div>
          </div>
        </div>

        <form onSubmit={handleSave} className={styles.form}>
          {msg.text && (
            <div className={`${styles.alert} ${msg.type === 'error' ? styles.alertError : styles.alertSuccess}`}>
              {msg.text}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Отображаемое имя</label>
            <input 
              name="name" 
              defaultValue={user.name} 
              className={styles.input} 
              required 
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Новая аватарка (jpg, png)</label>
            <input 
              type="file"
              name="avatar" 
              accept="image/*"
              className={styles.input} 
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Новый пароль (оставьте пустым, если не хотите менять)</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              className={styles.input} 
            />
          </div>

          <button type="submit" disabled={isPending} className={styles.saveBtn}>
            {isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  )
}
