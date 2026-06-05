'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './shell.module.css'

type Role = 'OWNER' | 'PM' | 'EMPLOYEE' | 'CLIENT'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string
}

function getNavItems(locale: string, role: Role): { section?: string; items: NavItem[] }[] {
  const base = `/${locale}`

  const common = [
    {
      href: `${base}/dashboard`,
      label: 'Дашборд',
      icon: <IconDashboard />,
    }
  ]

  if (role === 'CLIENT') {
    return [
      {
        items: [
          { href: `${base}/dashboard`, label: 'Мой проект', icon: <IconProject /> },
          { href: `${base}/chat`, label: 'Сообщения', icon: <IconChat /> },
        ]
      }
    ]
  }

  const groups: { section?: string; items: NavItem[] }[] = [
    {
      items: common
    },
    {
      section: 'Работа',
      items: [
        { href: `${base}/projects`, label: 'Проекты', icon: <IconProject /> },
        { href: `${base}/tasks`, label: 'Задачи', icon: <IconTask /> },
        { href: `${base}/chat`, label: 'Чат', icon: <IconChat /> },
      ]
    },
    {
      section: 'Инструменты',
      items: [
        { href: `${base}/plugins`, label: 'Плагины', icon: <IconPlugin /> },
        ...(role === 'OWNER' || role === 'PM'
          ? [{ href: `${base}/wiki`, label: 'База знаний', icon: <IconWiki /> }]
          : [])
      ]
    }
  ]

  if (role === 'OWNER') {
    groups.push({
      section: 'Управление',
      items: [
        { href: `${base}/finances`, label: 'Финансы', icon: <IconFinance /> },
        { href: `${base}/admin/users`, label: 'Команда', icon: <IconTeam /> },
        { href: `${base}/settings`, label: 'Настройки', icon: <IconSettings /> },
      ]
    })
  }

  return groups
}

const roleLabels: Record<Role, string> = {
  OWNER: 'Владелец',
  PM: 'Менеджер',
  EMPLOYEE: 'Сотрудник',
  CLIENT: 'Клиент',
}

const roleStyles: Record<Role, string> = {
  OWNER: styles.roleOwner,
  PM: styles.rolePm,
  EMPLOYEE: styles.roleEmployee,
  CLIENT: styles.roleClient,
}

export default function Sidebar({
  user,
  locale,
}: {
  user: { name?: string | null; email?: string | null; role: Role }
  locale: string
}) {
  const pathname = usePathname()
  const navGroups = getNavItems(locale, user.role)
  const initials = user.name
    ? user.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.sidebarLogo}>
        <div className={styles.sidebarLogoMark}>K</div>
        <div>
          <div className={styles.sidebarLogoText}>KAPUSTA.DEV</div>
          <div className={styles.sidebarLogoSub}>Studio Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflow: 'hidden auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {navGroups.map((group, gi) => (
          <div key={gi} className={styles.navSection}>
            {group.section && (
              <div className={styles.navLabel}>{group.section}</div>
            )}
            {group.items.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                >
                  {item.icon}
                  {item.label}
                  {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className={styles.sidebarBottom}>
        <div className={styles.sidebarUser}>
          <div className={styles.sidebarAvatar}>{initials}</div>
          <div className={styles.sidebarUserInfo}>
            <div className={styles.sidebarUserName}>{user.name ?? user.email}</div>
            <div className={`${styles.roleBadge} ${roleStyles[user.role]}`}>
              {roleLabels[user.role]}
            </div>
          </div>
          <button
            className={styles.sidebarLogout}
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            title="Выйти"
          >
            <IconLogout />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ---- SVG Icons ---- */
function IconDashboard() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>
}
function IconProject() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1.4"/><path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IconTask() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 4h12M2 8h8M2 12h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IconChat() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 8c0 3.314-2.686 5.5-6 5.5a6.5 6.5 0 01-2.5-.49L2 14l.99-3.5A5.3 5.3 0 012 8c0-3.314 2.686-5.5 6-5.5S14 4.686 14 8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
}
function IconPlugin() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/><path d="M11.5 9v6M9 11.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IconWiki() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 2h8l2 2v10H3V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M6 6h4M6 9h4M6 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IconFinance() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12l3-4 3 2 3-5 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 2v12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IconTeam() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 14c0-2.76 2.24-4 5-4s5 1.24 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M11 7c1.1 0 2 .9 2 2M13.5 14c0-1.5-.9-2.7-2.5-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IconSettings() {
  return <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function IconLogout() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
