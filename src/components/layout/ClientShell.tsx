'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import styles from '@/components/layout/shell.module.css'

export default function ClientShell({
  children,
  user,
  locale
}: {
  children: React.ReactNode
  user: any
  locale: string
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className={styles.shell}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`${styles.sidebarWrapper} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <Sidebar user={user} locale={locale} />
      </div>

      <div className={styles.main}>
        {/* Mobile Topbar */}
        <div className={styles.mobileTopbar}>
          <button className={styles.hamburgerBtn} onClick={() => setSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className={styles.mobileTopbarTitle}>KAPUSTA.DEV</div>
        </div>

        {children}
      </div>
    </div>
  )
}
