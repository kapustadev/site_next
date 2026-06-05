import Link from 'next/link';
import styles from './layout.module.css';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>KAPUSTA.DEV</div>
      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${styles.navItemActive}`}>Дашборд</Link>
        <Link href="/projects" className={styles.navItem}>Проекты</Link>
        <Link href="/plugins" className={styles.navItem}>Плагины</Link>
        <Link href="/finances" className={styles.navItem}>Финансы</Link>
        <Link href="/chat" className={styles.navItem}>Чат</Link>
      </nav>
      <div>
        {/* User profile placeholder */}
      </div>
    </aside>
  );
}
