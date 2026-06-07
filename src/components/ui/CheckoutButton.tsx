'use client'

import { useState } from 'react'

export default function CheckoutButton({ invoiceId, amount, currency = 'PLN' }: { invoiceId: string, amount: number, currency?: string }) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Ошибка при оплате')
      }
    } catch (err) {
      console.error(err)
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleCheckout} 
      disabled={loading}
      style={{
        background: '#010ED0',
        color: '#fff',
        border: 'none',
        padding: '8px 16px',
        borderRadius: '8px',
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
      {loading ? 'Загрузка...' : `Оплатить ${amount.toLocaleString('pl-PL')} ${currency}`}
    </button>
  )
}
