'use client'

import { useState, useTransition, useMemo, useRef, useEffect } from 'react'
import { createUser, updateUser, updateUserRole, deleteUser } from '@/actions'
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
const ROLE_STYLES: Record<Role, string> = {
  OWNER: styles.roleOwner,
  PM: styles.rolePm,
  EMPLOYEE: styles.roleEmployee,
  CLIENT: styles.roleClient,
}
const AVATAR_COLORS = [
  'linear-gradient(135deg,#010ED0,#1a27e0)',
  'linear-gradient(135deg,#1a27e0,#0284c7)',
  'linear-gradient(135deg,#0284c7,#0891b2)',
  'linear-gradient(135deg,#1d4ed8,#2563eb)',
  'linear-gradient(135deg,#010ED0,#0369a1)',
]

function avatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length]
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

// ── SVG Icons ──────────────────────────────────────────────
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M1 18c0-3.314 2.686-5.5 6-5.5s6 2.186 6 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M14 9c1.657 0 3 1.343 3 3M19 18c0-2.5-1.5-4-3-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconCrown() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M3 15h14M3 15l2-7 4 4 3-6 3 6 2-4-1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="3" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="17" cy="11" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="5" r="1.5" fill="currentColor"/>
    </svg>
  )
}
function IconWorker() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="10" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 10V8a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="14" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}
function IconClient() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 12h4M14 12h.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function IconChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3.5 5.5L7 9l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M9 2l2 2-7 7H2V9l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 3.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1.5 3h10M5 3V2h3v1M3 3l.5 8.5h6L10 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Custom Role Dropdown (for table) ───────────────────────
const ALL_ROLES: Role[] = ['OWNER', 'PM', 'EMPLOYEE', 'CLIENT']

function RoleDropdown({ value, onChange, disabled }: {
  value: Role; onChange: (r: Role) => void; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (disabled) return <span className={styles.roleDropdownDisabled}>—</span>

  return (
    <div className={styles.roleDropdownWrap} ref={ref}>
      <button
        type="button"
        className={`${styles.roleDropdownTrigger} ${ROLE_STYLES[value]}`}
        onClick={() => setOpen(o => !o)}
      >
        {ROLE_LABELS[value]}
        <span className={`${styles.roleDropdownChevron} ${open ? styles.roleDropdownChevronOpen : ''}`}>
          <IconChevron />
        </span>
      </button>
      {open && (
        <div className={styles.roleDropdownMenu}>
          {ALL_ROLES.map(r => (
            <button
              key={r}
              type="button"
              className={`${styles.roleDropdownItem} ${r === value ? styles.roleDropdownItemActive : ''}`}
              onClick={() => { onChange(r); setOpen(false) }}
            >
              <span className={`${styles.roleDot} ${ROLE_STYLES[r]}`} style={{
                background: r === 'OWNER' ? '#f59e0b' : r === 'PM' ? '#818cf8' : r === 'EMPLOYEE' ? '#22c55e' : '#a5b4fc'
              }} />
              {ROLE_LABELS[r]}
              {r === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', color: '#818cf8' }}>
                  <path d="M2.5 6l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Role Selector cards (for modal) ────────────────────────
const ROLE_DOT_COLORS: Record<Role, string> = {
  OWNER: '#f59e0b', PM: '#818cf8', EMPLOYEE: '#22c55e', CLIENT: '#a5b4fc'
}
const ROLE_DESCS: Record<Role, string> = {
  OWNER: 'Полный доступ',
  PM: 'Управляет проектами',
  EMPLOYEE: 'Выполняет задачи',
  CLIENT: 'Просмотр проекта',
}

function RoleSelector({ value, onChange }: { value: Role; onChange: (r: Role) => void }) {
  return (
    <div className={styles.roleSelectorGrid}>
      {ALL_ROLES.map(r => (
        <button
          key={r}
          type="button"
          className={`${styles.roleSelectorCard} ${value === r ? styles.roleSelectorCardActive : ''}`}
          onClick={() => onChange(r)}
        >
          <span className={styles.roleSelectorDot} style={{ background: ROLE_DOT_COLORS[r] }} />
          <span className={styles.roleSelectorLabel}>{ROLE_LABELS[r]}</span>
          <span className={styles.roleSelectorDesc}>{ROLE_DESCS[r]}</span>
          {value === r && (
            <span className={styles.roleSelectorCheck}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Error banner ────────────────────────────────────────────
function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 'var(--radius)',
      padding: '10px 14px',
      fontSize: 13,
      color: 'var(--red)',
      display: 'flex',
      gap: 8,
      alignItems: 'center',
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      {msg}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────
type ModalMode = 'create' | 'edit' | null

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
  const [isPending, startTransition] = useTransition()

  // Modal state
  const [mode, setMode] = useState<ModalMode>(null)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [formError, setFormError] = useState('')

  // Create form
  const [form, setForm] = useState({
    name: '', email: '', role: 'EMPLOYEE' as Role, password: generatePassword()
  })

  // Edit form
  const [editForm, setEditForm] = useState({
    name: '', email: '', role: 'EMPLOYEE' as Role, newPassword: ''
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

  function openCreate() {
    setForm({ name: '', email: '', role: 'EMPLOYEE', password: generatePassword() })
    setCreatedCreds(null)
    setFormError('')
    setMode('create')
  }

  function openEdit(user: User) {
    setEditTarget(user)
    setEditForm({ name: user.name, email: user.email, role: user.role, newPassword: '' })
    setFormError('')
    setMode('edit')
  }

  function closeModal() {
    setMode(null)
    setEditTarget(null)
    setCreatedCreds(null)
    setFormError('')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    startTransition(async () => {
      try {
        const user = await createUser({
          name: form.name,
          email: form.email,
          role: form.role,
          password: form.password,
        })
        setUsers(prev => [{ ...user, createdAt: new Date() } as any, ...prev])
        setCreatedCreds({ email: form.email, password: form.password })
      } catch (err: any) {
        setFormError(err.message || 'Ошибка создания пользователя')
      }
    })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setFormError('')
    startTransition(async () => {
      try {
        await updateUser(editTarget.id, {
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          password: editForm.newPassword || undefined,
        })
        setUsers(prev => prev.map(u =>
          u.id === editTarget.id
            ? { ...u, name: editForm.name, email: editForm.email, role: editForm.role }
            : u
        ))
        closeModal()
      } catch (err: any) {
        setFormError(err.message || 'Ошибка обновления пользователя')
      }
    })
  }

  async function handleRoleChange(userId: string, role: Role) {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    startTransition(async () => { await updateUserRole(userId, role) })
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
          <button className={styles.addBtn} onClick={openCreate}>
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
          <div className={styles.statIcon} style={{ background: 'rgba(1,14,208,0.15)', color: '#818cf8', border: '1px solid rgba(1,14,208,0.2)' }}>
            <IconUsers />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Всего</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(1,14,208,0.12)', color: '#60a5fa', border: '1px solid rgba(1,14,208,0.18)' }}>
            <IconCrown />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.owners}</div>
            <div className={styles.statLabel}>Владельцев</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(2,132,199,0.12)', color: '#38bdf8', border: '1px solid rgba(2,132,199,0.2)' }}>
            <IconWorker />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.employees}</div>
            <div className={styles.statLabel}>Сотрудников</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.18)' }}>
            <IconClient />
          </div>
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
                <td colSpan={5}>{search ? 'Ничего не найдено' : 'Пользователей пока нет'}</td>
              </tr>
            ) : filtered.map(user => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.avatar} style={{ background: avatarColor(user.id) }}>
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
                  <span className={`${styles.roleBadge} ${ROLE_STYLES[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td>
                  <RoleDropdown
                    value={user.role}
                    onChange={r => handleRoleChange(user.id, r)}
                    disabled={user.id === currentUserId}
                  />
                </td>
                <td>
                  <span className={styles.joinDate}>{formatDate(user.createdAt)}</span>
                </td>
                <td>
                  <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                    {user.id !== currentUserId && (
                      <>
                        <button
                          className={styles.actionBtn}
                          onClick={() => openEdit(user)}
                          title="Редактировать"
                        >
                          <IconEdit />
                        </button>
                        <button
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => handleDelete(user.id, user.name)}
                          title="Удалить"
                        >
                          <IconTrash />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modals ── */}
      {mode && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {mode === 'create'
                  ? (createdCreds ? 'Пользователь создан' : 'Новый пользователь')
                  : `Редактировать: ${editTarget?.name}`
                }
              </span>
              <button className={styles.modalClose} onClick={closeModal}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* ── CREATE success ── */}
            {mode === 'create' && createdCreds ? (
              <>
                <div className={styles.modalBody}>
                  <div className={styles.successBanner}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="10" cy="10" r="9" stroke="#22c55e" strokeWidth="1.5"/>
                      <path d="M6 10l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <strong>Аккаунт создан!</strong><br />
                      Передайте данные для входа пользователю.
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Email</label>
                    <div className={styles.generatedPwd}><span>{createdCreds.email}</span></div>
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
                  <button className={styles.btnCancel} onClick={closeModal}>Закрыть</button>
                  <button className={styles.btnSave} onClick={() => {
                    setCreatedCreds(null)
                    setForm({ name: '', email: '', role: 'EMPLOYEE', password: generatePassword() })
                  }}>+ Ещё один</button>
                </div>
              </>

            ) : mode === 'create' ? (
              /* ── CREATE form ── */
              <form onSubmit={handleCreate}>
                <div className={styles.modalBody}>
                  {formError && <ErrorBanner msg={formError} />}
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
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Роль *</label>
                    <RoleSelector value={form.role} onChange={r => setForm(f => ({ ...f, role: r }))} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Временный пароль</label>
                    <div className={styles.generatedPwd}>
                      <span>{form.password}</span>
                      <button type="button" className={styles.copyBtn} onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}>
                        Обновить
                      </button>
                    </div>
                    <span className={styles.hint}>Пароль сгенерирован автоматически. Скопируйте перед созданием.</span>
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>Отмена</button>
                  <button type="submit" className={styles.btnSave} disabled={isPending || !form.name.trim() || !form.email.trim()}>
                    {isPending ? 'Создаю...' : 'Создать пользователя'}
                  </button>
                </div>
              </form>

            ) : (
              /* ── EDIT form ── */
              <form onSubmit={handleEdit}>
                <div className={styles.modalBody}>
                  {formError && <ErrorBanner msg={formError} />}
                  <div className={styles.formRow}>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Имя *</label>
                      <input
                        autoFocus
                        className={styles.formInput}
                        placeholder="Иван Иванов"
                        value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.formLabel}>Email *</label>
                      <input
                        className={styles.formInput}
                        type="email"
                        placeholder="ivan@kapusta.dev"
                        value={editForm.email}
                        onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Роль</label>
                    <RoleSelector value={editForm.role} onChange={r => setEditForm(f => ({ ...f, role: r }))} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Новый пароль <span style={{ color: 'var(--text-3)', fontWeight: 400, textTransform: 'none', fontSize: 10 }}>(оставьте пустым, чтобы не менять)</span></label>
                    <input
                      className={styles.formInput}
                      type="password"
                      placeholder="Минимум 6 символов"
                      value={editForm.newPassword}
                      onChange={e => setEditForm(f => ({ ...f, newPassword: e.target.value }))}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className={styles.btnCancel} onClick={closeModal}>Отмена</button>
                  <button type="submit" className={styles.btnSave} disabled={isPending || !editForm.name.trim() || !editForm.email.trim()}>
                    {isPending ? 'Сохраняю...' : 'Сохранить изменения'}
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
