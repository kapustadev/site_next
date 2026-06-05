import { useTranslations } from 'next-intl';
import styles from '../page.module.css';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function Home() {
  const t = useTranslations('Index');

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={`glass ${styles.card}`}>
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.description}>{t('description')}</p>
            <button className={styles.btnPrimary}>Войти в систему</button>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
