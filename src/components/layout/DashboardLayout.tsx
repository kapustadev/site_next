import React from 'react';
import Sidebar from './Sidebar';
import styles from './layout.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <Sidebar />
      <div className={styles.main}>
        <header className={styles.topbar}>
          {/* Topbar items (Lang switcher, Notifications, Auth state) */}
        </header>
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
