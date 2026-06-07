import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import CheckoutButton from '@/components/ui/CheckoutButton'
import styles from './dashboard.module.css'
import shellStyles from '@/components/layout/shell.module.css'

type Role = 'OWNER' | 'PM' | 'EMPLOYEE' | 'CLIENT'

// Реальные данные прокидываются через пропсы

function fmt(n: number) {
  return n.toLocaleString('pl-PL') + ' PLN'
}

/* ── OWNER Dashboard ── */
function OwnerDashboard({ finances, projectsCount, chart }: { finances: any, projectsCount: number, chart: any }) {
  const max = Math.max(...chart.income, ...chart.expense, 1)
  return (
    <>
      <div className={styles.statsGrid}>
        <StatCard label="Выручка (месяц)" value={fmt(finances.revenue)} delta="" pos icon="📈" iconCls={styles.statIconBlue} />
        <StatCard label="Расходы (месяц)" value={fmt(finances.expenses)} delta="" pos={false} icon="💸" iconCls={styles.statIconRed} />
        <StatCard label="Чистая прибыль" value={fmt(finances.profit)} delta="" pos icon="💰" iconCls={styles.statIconGreen} />
        <StatCard label="Активных проектов" value={String(projectsCount)} delta="" pos icon="📁" iconCls={styles.statIconPurple} />
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
                {chart.months.map((m: string, i: number) => (
                  <div key={m+i} style={{flex:1, display:'flex', gap:'3px', alignItems:'flex-end', height:'100%'}}>
                    <div className={`${styles.chartBar} ${styles.chartBarIncome}`} style={{height: `${(chart.income[i]/max)*100}%`}} />
                    <div className={`${styles.chartBar} ${styles.chartBarExpense}`} style={{height: `${(chart.expense[i]/max)*100}%`}} />
                  </div>
                ))}
              </div>
              <div className={styles.chartLabels}>
                {chart.months.map((m: string, i: number) => <div key={m+i} className={styles.chartLabel}>{m}</div>)}
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
            <div style={{padding:'20px 0', textAlign:'center', color:'var(--text-3)', fontSize:'13px'}}>
              Перейдите в раздел Проекты для управления.
            </div>
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
            <div style={{padding:'20px 0', textAlign:'center', color:'var(--text-3)', fontSize:'13px'}}>
              Нет новых событий
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── EMPLOYEE / PM Dashboard ── */
function WorkerDashboard({ name, role, myTasks, myProjects }: { name: string; role: Role, myTasks: any[], myProjects: any[] }) {
  return (
    <>
      <div className={styles.statsGrid}>
        <StatCard label="Моих задач" value={String(myTasks.length)} delta="" pos icon="✅" iconCls={styles.statIconBlue} />
        <StatCard label="Просроченных" value="0" delta="" pos icon="⚠️" iconCls={styles.statIconGreen} />
        <StatCard label="Моих проектов" value={String(myProjects.length)} delta="" pos icon="📁" iconCls={styles.statIconYellow} />
        <StatCard label="Завершено" value="0" delta="" pos icon="🏆" iconCls={styles.statIconPurple} />
      </div>

      <div className={styles.twoCol}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Мои задачи</span>
            <a href="./tasks" className={styles.cardLink}>Все →</a>
          </div>
          <div className={styles.cardBody} style={{padding:'0 20px'}}>
            {myTasks.length === 0 && <div style={{padding:'20px 0', textAlign:'center', color:'var(--text-3)', fontSize:'13px'}}>Нет активных задач</div>}
            {myTasks.map(t => (
              <div key={t.id} className={styles.taskItem}>
                <div className={styles.taskCheck} />
                <div className={styles.taskTitle}>{t.title}</div>
                <div className={styles.taskProject}>{t.project.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Мои проекты</span>
          </div>
          <div className={styles.cardBody} style={{padding:'0 20px'}}>
            {myProjects.length === 0 && <div style={{padding:'20px 0', textAlign:'center', color:'var(--text-3)', fontSize:'13px'}}>Нет проектов</div>}
            {myProjects.map(p => {
              const done = p.tasks.filter((t: any) => t.status === 'DONE').length
              const progress = p.tasks.length > 0 ? Math.round((done / p.tasks.length) * 100) : 0
              return (
                <div key={p.id} className={styles.projectItem}>
                  <div className={styles.projectColor} style={{background: 'var(--blue)'}} />
                  <div className={styles.projectInfo}>
                    <div className={styles.projectName}>{p.name}</div>
                  </div>
                  <div className={styles.projectProgress}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{width:`${progress}%`, background: 'var(--blue)'}} />
                    </div>
                    <div className={styles.progressText}>{progress}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

/* ── CLIENT Dashboard ── */
function ClientDashboard({ myProjects, invoices }: { myProjects: any[], invoices: any[] }) {
  const p = myProjects[0]
  if (!p) return <div style={{textAlign:'center', padding:'40px'}}>У вас пока нет проектов</div>

  const done = p.tasks.filter((t: any) => t.status === 'DONE').length
  const progress = p.tasks.length > 0 ? Math.round((done / p.tasks.length) * 100) : 0

  return (
    <>
      {invoices.length > 0 && (
        <div className={styles.card} style={{marginBottom:'16px', border: '1px solid rgba(1, 14, 208, 0.4)'}}>
          <div className={styles.cardHeader} style={{ background: 'rgba(1, 14, 208, 0.1)' }}>
            <span className={styles.cardTitle}>Счета к оплате</span>
            <span className={styles.statLabel} style={{color:'var(--red)'}}>● Ожидает оплаты</span>
          </div>
          <div className={styles.cardBody} style={{padding:'20px'}}>
            {invoices.map(inv => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{inv.description || 'Оплата услуг'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Счет #{inv.id.slice(-6).toUpperCase()}</div>
                </div>
                <CheckoutButton invoiceId={inv.id} amount={inv.amount} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.card} style={{marginBottom:'16px'}}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Ваш проект</span>
          <span className={`${styles.statLabel}`} style={{color:'var(--green)'}}>● В работе</span>
        </div>
        <div className={styles.cardBody}>
          <div style={{fontSize:'18px', fontWeight:800, color:'var(--text)', marginBottom:'8px'}}>{p.name}</div>
          <div style={{marginBottom:'8px', display:'flex', justifyContent:'space-between'}}>
            <span style={{fontSize:'12px', color:'var(--text-2)'}}>Прогресс выполнения</span>
            <span style={{fontSize:'12px', fontWeight:700, color:'var(--text)'}}>{progress}%</span>
          </div>
          <div style={{height:'8px', background:'var(--surface-2)', borderRadius:'99px', overflow:'hidden'}}>
            <div style={{height:'100%', width:`${progress}%`, background:'var(--blue)', borderRadius:'99px', transition:'width 0.5s var(--ease)'}} />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Последние обновления</span>
        </div>
        <div className={styles.cardBody} style={{padding:'0 20px'}}>
          <div className={styles.activityList}>
            <div style={{padding:'20px 0', textAlign:'center', color:'var(--text-3)', fontSize:'13px'}}>
              Нет новых событий
            </div>
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

  // Fetch real data
  const { prisma } = await import('@/lib/prisma')
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  
  let myTasks: any[] = []
  let myProjects: any[] = []
  let myInvoices: any[] = []
  let chartData = {
    months: [] as string[],
    income: [] as number[],
    expense: [] as number[],
  }
  let activity: any[] = []
  let revenue = 0
  let expenses = 0
  let profit = 0
  let activeProjectsCount = 0

  if (role === 'OWNER') {
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: firstDayOfMonth } }
    })
    revenue = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0)
    expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)
    profit = revenue - expenses
    activeProjectsCount = await prisma.project.count()

    // Chart Data (last 6 months)
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const txs = await prisma.transaction.findMany({
        where: { date: { gte: start, lte: end } }
      })
      chartData.months.push(start.toLocaleString('ru', { month: 'short' }))
      chartData.income.push(txs.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0))
      chartData.expense.push(txs.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0))
    }
  }

  if (role === 'PM' || role === 'EMPLOYEE') {
    myTasks = await prisma.task.findMany({
      where: { assigneeId: (session.user as any).id },
      include: { project: true },
      orderBy: { dueDate: 'asc' },
      take: 5
    })
    myProjects = await prisma.project.findMany({
      where: { tasks: { some: { assigneeId: (session.user as any).id } } },
      include: { tasks: true },
      take: 3
    })
  }

  if (role === 'CLIENT') {
    myProjects = await prisma.project.findMany({
      where: { clientId: (session.user as any).id },
      include: { tasks: true },
      orderBy: { createdAt: 'desc' },
      take: 1
    })
    myInvoices = await prisma.invoice.findMany({
      where: { clientId: (session.user as any).id, status: 'PENDING' }
    })
  }

  return (
    <div className={shellStyles.content}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>{greeting}, {name.split(' ')[0]}! 👋</div>
          <div className={styles.pageSub}>{greetings[role] ?? 'Дашборд'} · {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(1, 14, 208, 0.12)',
          border: '1px solid rgba(1, 14, 208, 0.3)',
          borderRadius: '99px',
          padding: '6px 14px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#a5b4fc',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#010ED0',
            boxShadow: '0 0 8px #010ED0',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} />
          Система активна
        </div>
      </div>

      {role === 'OWNER' && <OwnerDashboard finances={{revenue, expenses, profit}} projectsCount={activeProjectsCount} chart={chartData} />}
      {(role === 'PM' || role === 'EMPLOYEE') && <WorkerDashboard name={name} role={role} myTasks={myTasks} myProjects={myProjects} />}
      {role === 'CLIENT' && <ClientDashboard myProjects={myProjects} invoices={myInvoices} />}
    </div>
  )
}
