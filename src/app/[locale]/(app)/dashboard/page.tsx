import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import styles from './dashboard.module.css'
import shellStyles from '@/components/layout/shell.module.css'

type Role = 'OWNER' | 'PM' | 'EMPLOYEE' | 'CLIENT'

/* ── Dummy data until we wire real DB queries ── */
const MOCK = {
  finances: { revenue: 124500, expenses: 47200, profit: 77300 },
  projects: [
    { id: '1', name: 'Landing Page — BioFarm', client: 'BioFarm LLC', deadline: '15 июн', progress: 78, color: '#010ED0' },
    { id: '2', name: 'Корпоративный сайт — ArgoTech', client: 'ArgoTech', deadline: '30 июн', progress: 42, color: '#7c3aed' },
    { id: '3', name: 'Интернет-магазин — StyleHouse', client: 'StyleHouse', deadline: '10 июл', progress: 15, color: '#22c55e' },
  ],
  myTasks: [
    { id: '1', title: 'Разработать компонент Hero Section', project: 'BioFarm', urgent: true },
    { id: '2', title: 'Ревью дизайна главной страницы', project: 'ArgoTech', urgent: false },
    { id: '3', title: 'Настроить WooCommerce', project: 'StyleHouse', urgent: false },
  ],
  activity: [
    { id: '1', who: 'ДК', name: 'Dmytro K.', text: 'создал задачу', target: '"Настроить WooCommerce"', time: '5 мин назад' },
    { id: '2', who: 'АМ', name: 'Anna M.', text: 'переместил задачу в', target: 'In Progress', time: '23 мин назад' },
    { id: '3', who: 'ВС', name: 'Viktor S.', text: 'завершил задачу', target: '"Hero Section"', time: '1 час назад' },
    { id: '4', who: 'ДК', name: 'Dmytro K.', text: 'добавил проект', target: 'StyleHouse', time: '2 часа назад' },
  ],
  chartMonths: ['Янв','Фев','Мар','Апр','Май','Июн'],
  chartIncome:  [65, 80, 72, 95, 110, 124],
  chartExpense: [40, 38, 45, 42, 50, 47],
}

function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' ₴'
}

/* ── OWNER Dashboard ── */
function OwnerDashboard() {
  const max = Math.max(...MOCK.chartIncome)
  return (
    <>
      <div className={styles.statsGrid}>
        <StatCard label="Выручка (месяц)" value={fmt(MOCK.finances.revenue)} delta="+12%" pos icon="📈" iconCls={styles.statIconBlue} />
        <StatCard label="Расходы (месяц)" value={fmt(MOCK.finances.expenses)} delta="+3%" pos={false} icon="💸" iconCls={styles.statIconRed} />
        <StatCard label="Чистая прибыль" value={fmt(MOCK.finances.profit)} delta="+18%" pos icon="💰" iconCls={styles.statIconGreen} />
        <StatCard label="Активных проектов" value="3" delta="" pos icon="📁" iconCls={styles.statIconPurple} />
      </div>

      <div className={styles.twoCol}>
        {/* Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Доходы vs Расходы</span>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'rgba(1,14,208,0.5)'}}/>Доходы</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{background:'rgba(239,68,68,0.4)'}}/>Расходы</div>
            </div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.chartPlaceholder}>
              <div className={styles.chartBars}>
                {MOCK.chartMonths.map((m, i) => (
                  <div key={m} style={{flex:1, display:'flex', gap:'3px', alignItems:'flex-end', height:'100%'}}>
                    <div className={`${styles.chartBar} ${styles.chartBarIncome}`} style={{height: `${(MOCK.chartIncome[i]/max)*100}%`}} />
                    <div className={`${styles.chartBar} ${styles.chartBarExpense}`} style={{height: `${(MOCK.chartExpense[i]/max)*100}%`}} />
                  </div>
                ))}
              </div>
              <div className={styles.chartLabels}>
                {MOCK.chartMonths.map(m => <div key={m} className={styles.chartLabel}>{m}</div>)}
              </div>
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Активные проекты</span>
            <a href="./projects" className={styles.cardLink}>Все →</a>
          </div>
          <div className={styles.cardBody} style={{padding:'0 20px'}}>
            {MOCK.projects.map(p => (
              <div key={p.id} className={styles.projectItem}>
                <div className={styles.projectColor} style={{background: p.color}} />
                <div className={styles.projectInfo}>
                  <div className={styles.projectName}>{p.name}</div>
                  <div className={styles.projectMeta}>{p.client} · до {p.deadline}</div>
                </div>
                <div className={styles.projectProgress}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{width:`${p.progress}%`, background: p.color}} />
                  </div>
                  <div className={styles.progressText}>{p.progress}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Последние события</span>
        </div>
        <div className={styles.cardBody} style={{padding:'0 20px'}}>
          <div className={styles.activityList}>
            {MOCK.activity.map(a => (
              <div key={a.id} className={styles.activityItem}>
                <div className={styles.activityAvatar}>{a.who}</div>
                <div className={styles.activityText}>
                  <div className={styles.activityMain}>
                    <strong>{a.name}</strong> {a.text} <strong>{a.target}</strong>
                  </div>
                  <div className={styles.activityTime}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ── EMPLOYEE / PM Dashboard ── */
function WorkerDashboard({ name, role }: { name: string; role: Role }) {
  return (
    <>
      <div className={styles.statsGrid}>
        <StatCard label="Моих задач" value="3" delta="" pos icon="✅" iconCls={styles.statIconBlue} />
        <StatCard label="Просроченных" value="0" delta="" pos icon="⚠️" iconCls={styles.statIconGreen} />
        <StatCard label="На ревью" value="1" delta="" pos icon="👁" iconCls={styles.statIconYellow} />
        <StatCard label="Завершено (месяц)" value="11" delta="+2" pos icon="🏆" iconCls={styles.statIconPurple} />
      </div>

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Мои задачи</span>
            <a href="./tasks" className={styles.cardLink}>Все →</a>
          </div>
          <div className={styles.cardBody} style={{padding:'0 20px'}}>
            {MOCK.myTasks.map(t => (
              <div key={t.id} className={styles.taskItem}>
                <div className={styles.taskCheck} />
                <div className={styles.taskTitle}>{t.title}</div>
                <div className={styles.taskProject}>{t.project}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Мои проекты</span>
          </div>
          <div className={styles.cardBody} style={{padding:'0 20px'}}>
            {MOCK.projects.slice(0, 2).map(p => (
              <div key={p.id} className={styles.projectItem}>
                <div className={styles.projectColor} style={{background: p.color}} />
                <div className={styles.projectInfo}>
                  <div className={styles.projectName}>{p.name}</div>
                  <div className={styles.projectMeta}>до {p.deadline}</div>
                </div>
                <div className={styles.projectProgress}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{width:`${p.progress}%`, background: p.color}} />
                  </div>
                  <div className={styles.progressText}>{p.progress}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ── CLIENT Dashboard ── */
function ClientDashboard() {
  const p = MOCK.projects[0]
  return (
    <>
      <div className={styles.card} style={{marginBottom:'16px'}}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Ваш проект</span>
          <span className={`${styles.statLabel}`} style={{color:'var(--green)'}}>● В работе</span>
        </div>
        <div className={styles.cardBody}>
          <div style={{fontSize:'18px', fontWeight:800, color:'var(--text)', marginBottom:'8px'}}>{p.name}</div>
          <div style={{fontSize:'13px', color:'var(--text-2)', marginBottom:'20px'}}>Дедлайн: {p.deadline}</div>
          <div style={{marginBottom:'8px', display:'flex', justifyContent:'space-between'}}>
            <span style={{fontSize:'12px', color:'var(--text-2)'}}>Прогресс выполнения</span>
            <span style={{fontSize:'12px', fontWeight:700, color:'var(--text)'}}>{p.progress}%</span>
          </div>
          <div style={{height:'8px', background:'var(--surface-2)', borderRadius:'99px', overflow:'hidden'}}>
            <div style={{height:'100%', width:`${p.progress}%`, background:'var(--blue)', borderRadius:'99px', transition:'width 0.5s var(--ease)'}} />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Последние обновления</span>
        </div>
        <div className={styles.cardBody} style={{padding:'0 20px'}}>
          <div className={styles.activityList}>
            {MOCK.activity.slice(0, 3).map(a => (
              <div key={a.id} className={styles.activityItem}>
                <div className={styles.activityAvatar}>{a.who}</div>
                <div className={styles.activityText}>
                  <div className={styles.activityMain}>
                    <strong>{a.name}</strong> {a.text} <strong>{a.target}</strong>
                  </div>
                  <div className={styles.activityTime}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Stat Card component ── */
function StatCard({ label, value, delta, pos, icon, iconCls }: {
  label: string; value: string; delta: string; pos: boolean; icon: string; iconCls: string
}) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statTop}>
        <div className={styles.statLabel}>{label}</div>
        <div className={`${styles.statIcon} ${iconCls}`}>{icon}</div>
      </div>
      <div className={styles.statValue}>{value}</div>
      {delta && (
        <div className={`${styles.statDelta} ${pos ? styles.statDeltaPos : styles.statDeltaNeg}`}>
          {pos ? '↑' : '↓'} {delta} vs прошлый месяц
        </div>
      )}
    </div>
  )
}

/* ── Role labels ── */
const greetings: Record<string, string> = {
  OWNER: 'Дашборд владельца',
  PM: 'Мой дашборд',
  EMPLOYEE: 'Мой дашборд',
  CLIENT: 'Мой проект',
}

/* ── Main page ── */
export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (!session?.user) redirect(`/${locale}`)

  const role: Role = (session.user as any).role ?? 'EMPLOYEE'
  const name = session.user.name ?? session.user.email ?? 'Пользователь'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  // Получаем реальные данные для владельца
  if (role === 'OWNER') {
    const { prisma } = await import('@/lib/prisma')
    
    // Текущий месяц
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: firstDayOfMonth } }
    })
    
    const revenue = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amountPln, 0)
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amountPln, 0)
    const profit = revenue - expenses
    
    const projectsCount = await prisma.project.count()
    
    // Заменяем глобальные MOCK
    MOCK.finances = { revenue, expenses, profit }
  }

  return (
    <div className={shellStyles.content}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>{greeting}, {name.split(' ')[0]}! 👋</div>
          <div className={styles.pageSub}>{greetings[role] ?? 'Дашборд'}</div>
        </div>
      </div>

      {role === 'OWNER' && <OwnerDashboard />}
      {(role === 'PM' || role === 'EMPLOYEE') && <WorkerDashboard name={name} role={role} />}
      {role === 'CLIENT' && <ClientDashboard />}
    </div>
  )
}
