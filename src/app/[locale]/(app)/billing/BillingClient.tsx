'use client'

import { useState, useTransition } from 'react'
import { updateInvoiceStatus, deleteInvoice } from '@/actions/billing'
import styles from './billing.module.css'

type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'

interface Invoice {
  id: string
  number: string
  description: string | null
  amount: number
  currency: string
  status: InvoiceStatus
  issuedAt: Date
  dueDate: Date | null
  paidAt: Date | null
  project: { id: string; name: string }
  client?: { id: string; name: string; email: string }
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачено',
  OVERDUE: 'Просрочено',
  CANCELLED: 'Отменено',
}
const STATUS_STYLES: Record<InvoiceStatus, string> = {
  PENDING: styles.statusPending,
  PAID: styles.statusPaid,
  OVERDUE: styles.statusOverdue,
  CANCELLED: styles.statusCancelled,
}

function formatDate(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} ${currency}`
}

export default function BillingClient({
  invoices: initial,
  isOwnerOrPm,
}: {
  invoices: Invoice[]
  isOwnerOrPm: boolean
}) {
  const [invoices, setInvoices] = useState(initial)
  const [isPending, startTransition] = useTransition()

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0)
  const totalPending = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + i.amount, 0)
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE').reduce((s, i) => s + i.amount, 0)

  function handleStatusChange(invoiceId: string, status: InvoiceStatus) {
    setInvoices(prev => prev.map(i => i.id === invoiceId ? { ...i, status, paidAt: status === 'PAID' ? new Date() : i.paidAt } : i))
    startTransition(async () => {
      await updateInvoiceStatus(invoiceId, status)
    })
  }

  function handleDelete(invoiceId: string) {
    if (!confirm('Удалить фактуру?')) return
    setInvoices(prev => prev.filter(i => i.id !== invoiceId))
    startTransition(async () => {
      await deleteInvoice(invoiceId)
    })
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <div className={styles.title}>Оплата</div>
          <div className={styles.subtitle}>Ваши счета и история платежей</div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 2v16M6 6h7a3 3 0 010 6H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className={styles.statValue} style={{ color: '#22c55e' }}>{formatAmount(totalPaid, 'PLN')}</div>
            <div className={styles.statLabel}>Оплачено</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(1,14,208,0.12)', color: '#818cf8', border: '1px solid rgba(1,14,208,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className={styles.statValue}>{formatAmount(totalPending, 'PLN')}</div>
            <div className={styles.statLabel}>Ожидает оплаты</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)' }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className={styles.statValue} style={{ color: '#ef4444' }}>{formatAmount(totalOverdue, 'PLN')}</div>
            <div className={styles.statLabel}>Просрочено</div>
          </div>
        </div>
      </div>

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="6" width="32" height="36" rx="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.emptyTitle}>Счетов пока нет</div>
          <div className={styles.emptyDesc}>Здесь появятся счета после выставления</div>
        </div>
      ) : (
        <div className={styles.invoiceList}>
          {invoices.map(inv => (
            <div key={inv.id} className={styles.invoiceCard}>
              <div className={styles.invoiceTop}>
                <div className={styles.invoiceNum}>{inv.number}</div>
                <span className={`${styles.statusBadge} ${STATUS_STYLES[inv.status]}`}>
                  {STATUS_LABELS[inv.status]}
                </span>
              </div>

              <div className={styles.invoiceProject}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <rect x="0.5" y="1.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M0.5 5h12" stroke="currentColor" strokeWidth="1.1"/>
                </svg>
                {inv.project.name}
                {inv.client && isOwnerOrPm && (
                  <span className={styles.invoiceClientBadge}>
                    {inv.client.name}
                  </span>
                )}
              </div>

              {inv.description && (
                <div className={styles.invoiceDesc}>{inv.description}</div>
              )}

              <div className={styles.invoiceMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLbl}>Выставлен</span>
                  <span className={styles.metaVal}>{formatDate(inv.issuedAt)}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLbl}>Срок оплаты</span>
                  <span className={`${styles.metaVal} ${inv.status === 'OVERDUE' ? styles.metaValOverdue : ''}`}>
                    {formatDate(inv.dueDate)}
                  </span>
                </div>
                {inv.paidAt && (
                  <div className={styles.metaItem}>
                    <span className={styles.metaLbl}>Оплачен</span>
                    <span className={styles.metaVal} style={{ color: '#22c55e' }}>{formatDate(inv.paidAt)}</span>
                  </div>
                )}
              </div>

              <div className={styles.invoiceFooter}>
                <div className={styles.invoiceAmount}>{formatAmount(inv.amount, inv.currency)}</div>
                {isOwnerOrPm && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                  <div className={styles.invoiceActions}>
                    <button
                      className={styles.actionPay}
                      onClick={() => handleStatusChange(inv.id, 'PAID')}
                      disabled={isPending}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Отметить оплаченным
                    </button>
                    <button
                      className={styles.actionCancel}
                      onClick={() => handleStatusChange(inv.id, 'CANCELLED')}
                      disabled={isPending}
                    >
                      Отменить
                    </button>
                    {isOwnerOrPm && (
                      <button
                        className={styles.actionDelete}
                        onClick={() => handleDelete(inv.id)}
                        disabled={isPending}
                        title="Удалить"
                      >
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path d="M1.5 3h10M5 3V2h3v1M3 3l.5 8.5h6L10 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
