'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createProject, deleteProject, updateProject } from '@/actions'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import styles from './projects.module.css'

const PROJECT_COLORS = ['#010ED0', '#7c3aed', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4']

interface Project {
  id: string
  name: string
  description: string | null
  budget: number | null
  currency: string
  budgetPln: number | null
  deadline: Date | null
  tasks: { id: string; status: string }[]
  manager: { name: string } | null
  managerId: string | null
  clientId: string | null
  members: { userId: string }[]
}

export default function ProjectsClient({
  projects: initialProjects,
  locale,
  canCreate,
  colors,
  role,
  users,
  currentUserId,
}: {
  projects: Project[]
  locale: string
  canCreate: boolean
  colors: string[]
  role: string
  users: { id: string; name: string; role: string; email: string }[]
  currentUserId: string
}) {
  const [projects, setProjects] = useState(initialProjects)
  const [showModal, setShowModal] = useState(false)
  const [editProjectId, setEditProjectId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '',
    description: '',
    budget: '',
    currency: 'PLN',
    deadline: '' as any,
    managerId: currentUserId,
    clientId: '',
    teamMemberIds: [] as string[],
  })

  const availableManagers = users.filter(u => u.role === 'OWNER' || u.role === 'PM')
  const availableClients = users.filter(u => u.role === 'CLIENT')
  const availableTeam = users.filter(u => u.role === 'OWNER' || u.role === 'PM' || u.role === 'EMPLOYEE')

  function getProgress(tasks: { status: string }[]) {
    if (!tasks.length) return 0
    const done = tasks.filter(t => t.status === 'DONE').length
    return Math.round((done / tasks.length) * 100)
  }

  function getColor(idx: number) {
    return PROJECT_COLORS[idx % PROJECT_COLORS.length]
  }

  function formatDate(d: Date | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    startTransition(async () => {
      const data = {
        name: form.name,
        description: form.description || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        currency: form.currency,
        deadline: form.deadline ? new Date(form.deadline) : undefined,
        managerId: form.managerId,
        clientId: form.clientId || undefined,
        teamMemberIds: form.teamMemberIds,
      }

      if (editProjectId) {
        const p = await updateProject(editProjectId, data)
        setProjects(prev => prev.map(proj => proj.id === editProjectId ? { ...p, tasks: proj.tasks, manager: users.find(u => u.id === (form.managerId || currentUserId)) } as any : proj))
      } else {
        const p = await createProject(data)
        setProjects(prev => [{ ...p, tasks: [], manager: users.find(u => u.id === (form.managerId || currentUserId)) } as any, ...prev])
      }
      
      setForm({ name: '', description: '', budget: '', currency: 'PLN', deadline: '', managerId: currentUserId, clientId: '', teamMemberIds: [] })
      setShowModal(false)
      setEditProjectId(null)
    })
  }

  function handleEdit(p: any) {
    setForm({
      name: p.name,
      description: p.description || '',
      budget: p.budget ? String(p.budget) : '',
      currency: p.currency || 'PLN',
      deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '',
      managerId: p.managerId || currentUserId,
      clientId: p.clientId || '',
      teamMemberIds: p.members?.map((m: any) => m.userId) || []
    })
    setEditProjectId(p.id)
    setShowModal(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить проект? Все задачи будут удалены.')) return
    startTransition(async () => {
      await deleteProject(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    })
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Проекты</div>
          <div className={styles.subtitle}>{projects.length} активных проектов</div>
        </div>
        {canCreate && (
          <button className={styles.addBtn} onClick={() => { setEditProjectId(null); setForm({ name: '', description: '', budget: '', currency: 'PLN', deadline: '', managerId: currentUserId, clientId: '', teamMemberIds: [] }); setShowModal(true) }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Новый проект
          </button>
        )}
      </div>

      <div className={styles.projectsGrid}>
        {projects.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <div className={styles.emptyText}>Проектов пока нет</div>
            <div className={styles.emptyHint}>
              {canCreate ? 'Нажмите «Новый проект», чтобы начать' : 'Проекты появятся здесь после создания'}
            </div>
          </div>
        ) : projects.map((p, idx) => {
          const color = getColor(idx)
          const progress = getProgress(p.tasks)
          const done = p.tasks.filter(t => t.status === 'DONE').length
          return (
            <Link
              key={p.id}
              href={`/${locale}/projects/${p.id}`}
              className={styles.projectCard}
            >
              <div className={styles.projectCardAccent} style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
              <div className={styles.projectCardTop}>
                <div>
                  <div className={styles.projectName}>{p.name}</div>
                  {p.description && (
                    <div className={styles.projectDesc}>{p.description}</div>
                  )}
                </div>
                {canCreate && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className={styles.projectCardMenu}
                      onClick={e => { e.preventDefault(); handleEdit(p) }}
                      title="Редактировать"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </button>
                    <button
                      className={styles.projectCardMenu}
                      onClick={e => { e.preventDefault(); handleDelete(p.id) }}
                      title="Удалить"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 3.5h10M5.5 3.5V2h3v1.5M6 6v4M8 6v4M3 3.5l.5 7.5h7l.5-7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.projectMeta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <rect x="0.5" y="1.5" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M3 0.5v1.5M8 0.5v1.5M0.5 4h10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                    </svg>
                    Дедлайн
                  </span>
                  <span className={styles.metaValue}>{formatDate(p.deadline)}</span>
                </div>
                {p.budget && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>💰 Бюджет</span>
                    <span className={styles.metaValue}>
                      {p.budget.toLocaleString('pl-PL')} {p.currency}
                      {p.currency !== 'PLN' && p.budgetPln && role !== 'CLIENT' && (
                        <span style={{ fontSize: '10px', color: 'var(--text-3)', marginLeft: '4px' }}>
                          (~{Math.round(p.budgetPln).toLocaleString('pl-PL')} PLN)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>✅ Задачи</span>
                  <span className={styles.metaValue}>{done} / {p.tasks.length}</span>
                </div>
              </div>

              <div className={styles.projectProgress}>
                <div className={styles.progressRow}>
                  <span className={styles.progressLabel}>Прогресс</span>
                  <span className={styles.progressPct}>{progress}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progress}%`, background: color }} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Новый проект</span>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Название *</label>
                  <input
                    className={styles.formInput}
                    placeholder="Например: Сайт для BioFarm"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Описание</label>
                  <textarea
                    className={`${styles.formInput} ${styles.formTextarea}`}
                    placeholder="Краткое описание проекта..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Бюджет</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className={styles.formInput}
                        type="number"
                        placeholder="50000"
                        value={form.budget}
                        onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                        style={{ flex: 1 }}
                      />
                      <select
                        className={styles.formInput}
                        value={form.currency}
                        onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                        style={{ width: '80px', appearance: 'auto', padding: '0 8px' }}
                      >
                        {['PLN', 'USD', 'EUR', 'UAH', 'GBP', 'CHF'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Дедлайн</label>
                    <input
                      className={styles.formInput}
                      type="date"
                      value={form.deadline}
                      onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Project Manager</label>
                    <select
                      className={styles.formInput}
                      value={form.managerId}
                      onChange={e => setForm(f => ({ ...f, managerId: e.target.value }))}
                     
                    >
                      {availableManagers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Клиент</label>
                    <select
                      className={styles.formInput}
                      value={form.clientId}
                      onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                     
                    >
                      <option value="">— Без клиента —</option>
                      {availableClients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Команда</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {availableTeam.map(u => (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: 'var(--text-2)' }}>
                        <input
                          type="checkbox"
                          checked={form.teamMemberIds.includes(u.id)}
                          onChange={e => {
                            if (e.target.checked) setForm(f => ({ ...f, teamMemberIds: [...f.teamMemberIds, u.id] }))
                            else setForm(f => ({ ...f, teamMemberIds: f.teamMemberIds.filter(id => id !== u.id) }))
                          }}
                        />
                        {u.name} <span style={{ fontSize: '11px', color: 'var(--text-3)', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{u.role}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>
                  Отмена
                </button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !form.name.trim()}>
                  {isPending ? 'Сохранение...' : editProjectId ? 'Сохранить изменения' : 'Создать проект'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
