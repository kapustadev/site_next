'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

type LoginMode = 'employee' | 'client'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('client')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError('Неверный email или пароль')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  function switchMode(m: LoginMode) {
    setMode(m)
    setError('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className={styles.page}>
      {/* ---- Left Artwork ---- */}
      <div className={styles.artwork}>
        <div className={styles.artworkBg} />
        <div className={styles.artworkGrid} />
        <div className={styles.artworkOrb1} />
        <div className={styles.artworkOrb2} />
        <div className={styles.artworkOrb3} />

        <div className={styles.artworkContent}>
          <div className={styles.artworkTag}>
            <span className={styles.artworkDot} />
            Система активна
          </div>
          <h1 className={styles.artworkTitle}>
            Внутренняя<br />
            платформа<br />
            <span>KAPUSTA.DEV</span>
          </h1>
          <p className={styles.artworkSub}>
            Управление проектами, задачами, финансами и командой — в одном месте.
          </p>
        </div>
      </div>

      {/* ---- Right Form Panel ---- */}
      <div className={styles.panel}>
        <div className={styles.panelGlow} />

        <div className={styles.logo}>
          <div className={styles.logoMark}>K</div>
          <div className={styles.logoText}>KAPUSTA.DEV</div>
        </div>

        {/* Mode Switcher */}
        <div className={styles.modeSwitcher}>
          <button
            id="mode-client"
            type="button"
            className={`${styles.modeBtn} ${mode === 'client' ? styles.modeBtnActive : ''}`}
            onClick={() => switchMode('client')}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M5 7h6M5 9.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Клиент
          </button>
          <button
            id="mode-employee"
            type="button"
            className={`${styles.modeBtn} ${mode === 'employee' ? styles.modeBtnActive : ''}`}
            onClick={() => switchMode('employee')}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Работник
          </button>
        </div>

        <div className={styles.formHeader}>
          <h2 className={styles.formTitle}>
            {mode === 'employee' ? 'Вход для сотрудников' : 'Клиентский кабинет'}
          </h2>
          <p className={styles.formSubtitle}>
            {mode === 'employee'
              ? <>Введите рабочие данные для входа.<br />Доступ выдаётся администратором.</>
              : <>Войдите, чтобы просматривать статус<br />вашего проекта.</>
            }
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5"/>
                <path d="M8 5v3.5M8 10.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </span>
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder={mode === 'employee' ? 'you@kapusta.dev' : 'client@example.com'}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Пароль</label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                id="password"
                type="password"
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            className={`${styles.submitBtn} ${mode === 'client' ? styles.submitBtnClient : ''}`}
            disabled={loading}
          >
            {loading ? (
              <><div className={styles.spinner} /> Вхожу...</>
            ) : (
              <>
                {mode === 'employee' ? 'Войти в систему' : 'Войти как клиент'}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className={styles.footer}>
          <span className={styles.footerText}>© 2025 KAPUSTA.DEV</span>
          <div className={styles.footerBadge}>
            <span className={styles.secureDot} />
            Защищённое соединение
          </div>
        </div>
      </div>
    </div>
  )
}
