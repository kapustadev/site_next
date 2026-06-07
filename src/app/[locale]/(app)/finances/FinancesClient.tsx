'use client'

import { useState, useTransition } from 'react'
import { createTransaction, deleteTransaction } from '@/actions/finances'
import CustomDatePicker from '@/components/ui/CustomDatePicker'
import styles from './finances.module.css'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  description: string
  category: string | null
  amount: number
  currency: string
  amountPln: number
  exchangeRate: number
  date: Date
  project: { name: string } | null
}

const SUPPORTED_CURRENCIES = ['PLN', 'USD', 'EUR', 'UAH', 'GBP', 'CHF', 'CZK', 'HUF']

export default function FinancesClient({
  transactions: initial,
  projects
}: {
  transactions: Transaction[]
  projects: { id: string, name: string }[]
}) {
  const [transactions, setTransactions] = useState(initial)
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    description: '',
    category: '',
    amount: '',
    currency: 'PLN',
    projectId: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Calculate stats in PLN
  const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amountPln, 0)
  const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amountPln, 0)
  const profit = income - expense

  function fmtPln(n: number) {
    return Math.round(n).toLocaleString('pl-PL') + ' PLN'
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const t = await createTransaction({
        type: form.type,
        description: form.description,
        category: form.category || 'General',
        amount: Number(form.amount),
        projectId: form.projectId || undefined,
        date: form.date || undefined
      })
      const proj = projects.find(p => p.id === form.projectId)
      setTransactions(prev => [{ ...t, project: proj ? { name: proj.name } : null } as any, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))
      setShowModal(false)
      setForm({ type: 'INCOME', description: '', category: '', amount: '', currency: 'PLN', projectId: '', date: new Date().toISOString().split('T')[0] })
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('Удалить транзакцию?')) return
    startTransition(async () => {
      await deleteTransaction(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
    })
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Финансы</div>
          <div className={styles.subtitle}>Учёт доходов и расходов с автоконвертацией NBP</div>
        </div>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Добавить транзакцию
        </button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statLabel}>Доходы</div>
            <div className={styles.statIcon} style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>↓</div>
          </div>
          <div className={styles.statValue}>{fmtPln(income)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statLabel}>Расходы</div>
            <div className={styles.statIcon} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>↑</div>
          </div>
          <div className={styles.statValue}>{fmtPln(expense)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTop}>
            <div className={styles.statLabel}>Прибыль</div>
            <div className={styles.statIcon} style={{ background: 'rgba(1,14,208,0.12)', color: '#818cf8' }}>=</div>
          </div>
          <div className={styles.statValue}>{fmtPln(profit)}</div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Тип</th>
              <th>Описание / Проект</th>
              <th>Категория</th>
              <th style={{ textAlign: 'right' }}>Сумма (Ориг.)</th>
              <th style={{ textAlign: 'right' }}>Сумма (PLN)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>Транзакций пока нет</td></tr>
            ) : transactions.map(t => (
              <tr key={t.id}>
                <td style={{ color: 'var(--text-2)', fontSize: '12px' }}>
                  {new Date(t.date).toLocaleDateString('ru-RU')}
                </td>
                <td>
                  <span className={`${styles.typeBadge} ${t.type === 'INCOME' ? styles.typeBadgeIncome : styles.typeBadgeExpense}`}>
                    {t.type === 'INCOME' ? 'Доход' : 'Расход'}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{t.description}</div>
                  {t.project && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>Проект: {t.project.name}</div>}
                </td>
                <td style={{ color: 'var(--text-2)' }}>{t.category || '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <div className={t.type === 'INCOME' ? styles.amountIncome : styles.amountExpense}>
                    {t.type === 'INCOME' ? '+' : '-'}{t.amount.toLocaleString('pl-PL')} {t.currency}
                  </div>
                  {t.currency !== 'PLN' && (
                    <div className={styles.subAmount}>Курс: {t.exchangeRate.toFixed(4)}</div>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>
                  {t.amountPln.toLocaleString('pl-PL')} PLN
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className={styles.delBtn} onClick={() => handleDelete(t.id)} title="Удалить">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M1.5 3h10M5 3V2h3v1M3 3l.5 8.5h6L10 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>Новая транзакция</span>
              <button className={styles.modalClose} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Тип *</label>
                    <select className={styles.formInput} value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value as any}))}>
                      <option value="INCOME">Доход</option>
                      <option value="EXPENSE">Расход</option>
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Дата *</label>
                    <CustomDatePicker className={styles.formInput} value={form.date} onChange={val => setForm(f => ({...f, date: val}))} required />
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>Описание *</label>
                  <input className={styles.formInput} placeholder="Оплата за этап 1..." value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} required />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Сумма *</label>
                    <input className={styles.formInput} type="number" step="0.01" placeholder="1000" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} required />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Валюта *</label>
                    <select className={styles.formInput} value={form.currency} onChange={e => setForm(f => ({...f, currency: e.target.value}))}>
                      {SUPPORTED_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                {form.currency !== 'PLN' && (
                  <div className={styles.nbpNote}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    Сумма будет автоматически конвертирована в PLN по актуальному курсу NBP (Narodowy Bank Polski).
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Категория</label>
                    <input className={styles.formInput} placeholder="Сервисы, Зарплата..." value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>Привязка к проекту</label>
                    <select className={styles.formInput} value={form.projectId} onChange={e => setForm(f => ({...f, projectId: e.target.value}))}>
                      <option value="">— Без проекта —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setShowModal(false)}>Отмена</button>
                <button type="submit" className={styles.btnSave} disabled={isPending || !form.description || !form.amount}>
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
