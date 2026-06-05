'use client'

import { useState, useTransition, useMemo } from 'react'
import { createUser, updateUserRole, deleteUser } from '@/actions'
import styles from './users.module.css'

type Role = 'OWNER' | 'PM' | 'EMPLOYEE' | 'CLIENT'

interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
}

const ROLE_LABELS: Record<Role, string> = {
  OWNER: 'Владелец', PM: 'Менеджер', EMPLOYEE: 'Сотрудник', CLIENT: 'Клиент'
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#010ED0,#7c3aed)',
  'linear-gradient(135deg,#7c3aed,#db2777)',
  'linear-gradient(135deg,#059669,#0891b2)',
  'linear-gradient(135deg,#d97706,#dc2626)',
  'linear-gradient(135deg,#0891b2,#2563eb)',
]

function avatarColor(id: string) {
  const n = id.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[n]
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function UsersClient({
  users: initial,
  locale,
  currentUserId,
}: {
  users: User[]
  locale: string
  currentUserId: string
}) {
  const [users, setUsers] = useState(initial)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', role: 'EMPLOYEE' as Role, password: generatePassword()
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q ? users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      ROLE_LABELS[u.role].toLowerCase().includes(q)
    ) : users
  }, [users, search])

  const stats = useMemo(() => ({
    total: users.length,
    owners: users.filter(u => u.role === 'OWNER').length,
    employees: users.filter(u => u.role === 'EMPLOYEE' || u.role === 'PM').length,
    clients: users.filter(u => u.role === 'CLIENT').length,
  }), [users])

  function openModal() {
    setForm({ name: '', email: '', role: 'EMPLOYEE', password: generatePassword() })
    setCreatedCreds(null)
    setShowModal(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const user = await createUser({
        name: form.name,
        email: form.email,
        role: form.role,
        password: form.password,
      })
      setUsers(prev => [{ ...user, createdAt: new Date() } as any, ...prev])
      setCreatedCreds({ email: form.email, password: form.password })
    })
  }

  async function handleRoleChange(userId: string, role: string) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: role as Role } : u))
    startTransition(async () => {
      await updateUserRole(userId, role)
    })
  }

  async function handleDelete(userId: string, name: string) {
    if (!confirm(`Удалить пользователя ${name}? Это действие нельзя отменить.`)) return
    startTransition(async () => {
      await deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
    })
  }

  function copyPassword() {
    if (!createdCreds) return
    navigator.clipboard.writeText(createdCreds.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Команда</div>
          <div className={styles.subtitle}>Управление доступами и ролями</div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={openModal}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Добавить пользователя
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(1,14,208,0.12)' }}>👥</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Всего</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(245,158,11,0.12)' }}>👑</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.owners}</div>
            <div className={styles.statLabel}>Владельцев</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(34,197,94,0.12)' }}>🛠</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.employees}</div>
            <div className={styles.statLabel}>Сотрудников</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(99,102,241,0.12)' }}>🤝</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.clients}</div>
            <div className={styles.statLabel}>Клиентов</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <span className={styles.tableTitle}>Пользователи ({filtered.length})</span>
          <div className={styles.search}>
            <span className={styles.searchIcon}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </span>
            <input
              className={styles.searchInput}
              placeholder="Поиск по имени, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Роль</th>
              <th>Изменить роль</th>
              <th>Дата добавления</th>
              <th style={{ textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr className={styles.emptyRow}>
                <td colSpan={5}>
                  {search ? 'Ничего не найдено' : 'Пользователей пока нет'}
                </td>
              </tr>
            ) : filtered.map(user => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userCell}>
                    <div
                      className={styles.avatar}
                      style={{ background: avatarColor(user.id) }}
                    >
                      {initials(user.name)}
                    </div>
                    <div>
                      <div className={styles.userName}>
                        {user.name}
                        {user.id === currentUserId && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>(вы)</span>
                        )}
                      </div>
                      <div className={styles.userEmail}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`${styles.roleBadge} ${styles[`role${user.role.charAt(0) + user.role.slice(1).toLowerCase()}` as keyof typeof styles]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td>
                  {user.id !== currentUserId ? (
                    <select
                      className={styles.roleSelect}
                      value={user.role}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="OWNER">Владелец</option>
                      <option value="PM">Менеджер</option>
                      <option value="EMPLOYEE">Сотрудник</option>
                      <option value="CLIENT">Клиент</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
                  )}
                </td>
                <td>
                  <span className={styles.joinDate}>{formatDate(user.createdAt)}</span>
                </td>
                <td>
                  <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                    {user.id !== currentUserId && (
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => handleDelete(user.id, user.name)}
                        title="Удалить"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M1.5 3h10M5 3V2h3v1M3 3l.5 8.5h6L10 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {createdCreds ? '✅ Пользователь создан' : 'Новый пользователь'}
              </span>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {createdCreds ? (
              <>
                <div className={styles.modalBody}>
                  <div className={styles.successBanner}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="9" stroke="#22c55e" strokeWidth="1.5"/>
                      <path d="M6 10l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <strong>Аккаунт создан!</strong><br />
                      Передайте данные для входа пользователю. После первого входа рекомендуется сменить пароль.
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Email</label>
                    <div className={styles.generatedPwd}>
                      <span>{createdCreds.email}</span>
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Временный пароль</label>
                    <div className={styles.generatedPwd}>
                      <span>{createdCreds.password}</span>
                      <button className={styles.copyBtn} onClick={copyPassword}>
                        {copied ? '✓ Скопировано' : 'Копировать'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button className={styles.btnCancel} onClick={() => { setShowModal(false); setCreatedCreds(null) }}>
                    Закрыть
                  </button>
                  <button className={styles.btnSave} onClick={() => { setCreatedCreds(null); setForm({ name:'', email:'', role:'EMPLOYEE', password: generatePassword() }) }}>
                    + Ещё один
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleCreate}>
                <div className={styles.modalBody}>
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Имя *</label>
                      <input
                        autoFocus
                        className={styles.formInput}
                        placeholder="Иван Иванов"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Роль *</label>
                      <select
                        className={styles.formInput}
                        value={form.role}
                        onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                        style={{ appearance: 'auto' }}
                      >
                        <option value="PM">Менеджер</option>
                        <option value="EMPLOYEE">Сотрудник</option>
                        <option value="CLIENT">Клиент</option>
                        <option value="OWNER">Владелец</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Email *</label>
                    <input
                      className={styles.formInput}
                      type="email"
                      placeholder="ivan@kapusta.dev"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Временный пароль</label>
                    <div className={styles.generatedPwd}>
                      <span>{form.password}</span>
                      <button type="button" className={styles.copyBtn} onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}>
                        Обновить
                      </button>
                    </div>
                    <span className={styles.hint}>
                      Пароль сгенерирован автоматически. Скопируйте его перед созданием.
                    </span>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className={styles.btnSave}
                    disabled={isPending || !form.name.trim() || !form.email.trim()}
                  >
                    {isPending ? 'Создаю...' : 'Создать пользователя'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
