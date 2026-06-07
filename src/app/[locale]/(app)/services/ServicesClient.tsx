'use client'

import { useState, useTransition } from 'react'
import { createService, updateService, deleteService } from '@/actions/services'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import styles from './services.module.css'

export default function ServicesClient({
  services: initial,
  canEdit,
  clients,
  projects
}: {
  services: any[]
  canEdit: boolean
  clients: any[]
  projects: any[]
}) {
  const [services, setServices] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    name: '',
    type: 'HOSTING',
    price: '',
    currency: 'PLN',
    billingCycle: 'YEARLY',
    nextDueDate: '',
    clientId: '',
    projectId: ''
  })

  const filteredProjects = form.clientId ? projects.filter(p => p.clientId === form.clientId) : []

  function handleEdit(s: any) {
    setForm({
      name: s.name,
      type: s.type,
      price: String(s.price),
      currency: s.currency,
      billingCycle: s.billingCycle,
      nextDueDate: new Date(s.nextDueDate).toISOString().split('T')[0],
      clientId: s.clientId,
      projectId: s.projectId || ''
    })
    setEditId(s.id)
    setShowModal(true)
  }

  function handleAdd() {
    setForm({
      name: '',
      type: 'HOSTING',
      price: '',
      currency: 'PLN',
      billingCycle: 'YEARLY',
      nextDueDate: '',
      clientId: '',
      projectId: ''
    })
    setEditId(null)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.clientId) return

    startTransition(async () => {
      const data = {
        name: form.name,
        type: form.type as any,
        price: Number(form.price),
        currency: form.currency as any,
        billingCycle: form.billingCycle as any,
        nextDueDate: form.nextDueDate,
        clientId: form.clientId,
        projectId: form.projectId || undefined
      }

      if (editId) {
        const s = await updateService(editId, data)
        const cl = clients.find(c => c.id === s.clientId)
        const pr = projects.find(p => p.id === s.projectId)
        setServices(prev => prev.map(p => p.id === editId ? { ...s, client: cl, project: pr } : p))
      } else {
        const s = await createService(data)
        const cl = clients.find(c => c.id === s.clientId)
        const pr = projects.find(p => p.id === s.projectId)
        setServices(prev => [...prev, { ...s, client: cl, project: pr }].sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime()))
      }
      setShowModal(false)
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить эту услугу?')) return
    startTransition(async () => {
      await deleteService(id)
      setServices(prev => prev.filter(s => s.id !== id))
    })
  }

  const now = new Date()
  const nextMonth = new Date()
  nextMonth.setDate(now.getDate() + 30)

  const upcomingServices = services.filter(s => {
    const due = new Date(s.nextDueDate)
    return due <= nextMonth
  }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())

  return (
    <>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Хостинги и Домены</div>
          <div className={styles.subtitle}>Управление регулярными подписками и услугами</div>
        </div>
        {canEdit && (
          <button className={styles.addBtn} onClick={handleAdd}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Добавить услугу
          </button>
        )}
      </div>

      {upcomingServices.length > 0 && (
        <div className={styles.notificationsBlock}>
          <div className={styles.notificationsTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Уведомления об оплате
          </div>
          <div className={styles.notificationsList}>
            {upcomingServices.map(s => {
              const due = new Date(s.nextDueDate)
              const isOverdue = due < now
              return (
                <div key={s.id} className={`${styles.notificationItem} ${isOverdue ? styles.notificationOverdue : ''}`}>
                  <div className={styles.notificationText}>
                    {isOverdue ? 'Просрочено:' : 'Скоро заканчивается:'} у клиента <strong>{s.client?.name || '—'}</strong> услуга <strong>{s.name}</strong> 
                    {' '}({s.type === 'HOSTING' ? 'Хостинг' : s.type === 'DOMAIN' ? 'Домен' : 'Услуга'}).
                  </div>
                  <div className={styles.notificationDate}>
                    до {due.toLocaleDateString('ru-RU')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className={styles.grid}>
        {services.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🌐</div>
            <div className={styles.emptyText}>Услуг пока нет</div>
            <div className={styles.emptyHint}>Здесь будут отображаться активные домены и хостинги</div>
          </div>
        ) : services.map(s => {
          const isOverdue = new Date(s.nextDueDate) < new Date()
          return (
            <div key={s.id} className={styles.card}>
              <div className={s.type === 'HOSTING' ? styles.cardAccentHosting : styles.cardAccentDomain} />
              
              <div className={styles.cardTop}>
                <div>
                  <div className={styles.cardName}>{s.name}</div>
                  <div className={`${styles.cardType} ${s.type === 'HOSTING' ? styles.cardTypeHosting : styles.cardTypeDomain}`}>
                    {s.type === 'HOSTING' ? 'Хостинг' : s.type === 'DOMAIN' ? 'Домен' : 'Услуга'}
                  </div>
                </div>
                {canEdit && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className={styles.menuBtn} onClick={() => handleEdit(s)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button className={styles.menuBtn} onClick={() => handleDelete(s.id)}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2h3v1.5M6 6v4M8 6v4M3 3.5l.5 7.5h7l.5-7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.cardPrice}>
                {s.price.toLocaleString('pl-PL')} {s.currency}
                <span className={styles.cardCycle}>/ {s.billingCycle === 'YEARLY' ? 'год' : 'мес'}</span>
              </div>

              <div className={styles.cardDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>📅 Сл. оплата</span>
                  <span className={`${styles.detailValue} ${isOverdue ? styles.overdue : ''}`}>
                    {new Date(s.nextDueDate).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                {canEdit && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>👤 Клиент</span>
                    <span className={styles.detailValue}>{s.client?.name || '—'}</span>
                  </div>
                )}
                {s.project && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>📁 Проект</span>
                    <span className={styles.detailValue}>{s.project.name}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>{editId ? 'Редактировать услугу' : 'Новая услуга'}</span>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Название (домен, тариф) *</label>
                    <input className={styles.formInput} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Тип *</label>
                    <select className={styles.formInput} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                      <option value="HOSTING">Хостинг</option>
                      <option value="DOMAIN">Домен</option>
                      <option value="OTHER">Другое</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Цена *</label>
                    <input className={styles.formInput} type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} required />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Валюта</label>
                    <select className={styles.formInput} value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))}>
                      <option value="PLN">PLN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="UAH">UAH</option>
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Цикл</label>
                    <select className={styles.formInput} value={form.billingCycle} onChange={e => setForm(f => ({...f, billingCycle: e.target.value}))}>
                      <option value="YEARLY">В год</option>
                      <option value="MONTHLY">В месяц</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Следующая оплата *</label>
                  <CustomDatePicker className={styles.formInput} value={form.nextDueDate} onChange={val => setForm(f => ({...f, nextDueDate: val}))} required />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Клиент *</label>
                    <select className={styles.formInput} value={form.clientId} onChange={e => setForm(f => ({...f, clientId: e.target.value}))} required>
                      <option value="">— Выберите клиента —</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Привязка к проекту</label>
                    <select className={styles.formInput} value={form.projectId} onChange={e => setForm(f => ({...f, projectId: e.target.value}))}>
                      <option value="">— Без привязки —</option>
                      {filteredProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !form.name || !form.clientId || !form.price}>
                  {isPending ? 'Сохраняю...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
