import { useMemo } from 'react'
import { CheckCircle2, AlertTriangle, Folder, Flame } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore.js'
import { isInThisWeek, heatmapBuckets, isOverdueIso } from '../lib/dateUtils.js'

export default function StatsPanel() {
  const tasks = useTaskStore((s) => s.tasks)
  const groups = useTaskStore((s) => s.groups)

  const stats = useMemo(() => {
    const doneThisWeek = tasks.filter(
      (t) => t.completed && t.completedAt && isInThisWeek(t.completedAt.slice(0, 10))
    ).length

    const overdue = tasks.filter((t) => !t.completed && isOverdueIso(t.dueDate)).length

    const groupStats = groups.map((g) => {
      const inG = tasks.filter((t) => t.groupId === g.id)
      const done = inG.filter((t) => t.completed).length
      return {
        ...g,
        total: inG.length,
        done,
        rate: inG.length === 0 ? 0 : Math.round((done / inG.length) * 100)
      }
    })

    const buckets = heatmapBuckets(56)
    const doneByDay = {}
    for (const t of tasks) {
      if (t.completed && t.completedAt) {
        const key = t.completedAt.slice(0, 10)
        doneByDay[key] = (doneByDay[key] || 0) + 1
      }
    }
    const heat = buckets.map((b) => ({
      ...b,
      count: doneByDay[b.key] || 0
    }))
    const maxHeat = Math.max(1, ...heat.map((h) => h.count))

    return { doneThisWeek, overdue, groupStats, heat, maxHeat }
  }, [tasks, groups])

  return (
    <div className="flex flex-col h-full overflow-auto">
      <header className="px-6 pt-5 pb-3">
        <h1 className="title-serif text-2xl">统计</h1>
        <p className="text-muted text-xs mt-1">看看最近做了多少事</p>
      </header>

      <div className="px-6 pb-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <KpiCard icon={CheckCircle2} color="success" label="本周完成" value={stats.doneThisWeek} />
          <KpiCard icon={AlertTriangle} color="danger" label="逾期任务" value={stats.overdue} />
        </div>

        <section className="bg-card border border-soft rounded-card p-4">
          <h3 className="title-serif text-base mb-3 flex items-center gap-2">
            <Flame size={16} className="text-accent" /> 最近 8 周完成热力图
          </h3>
          <Heatmap heat={stats.heat} max={stats.maxHeat} />
        </section>

        <section className="bg-card border border-soft rounded-card p-4">
          <h3 className="title-serif text-base mb-3 flex items-center gap-2">
            <Folder size={16} className="text-accent" /> 各分组完成率
          </h3>
          {stats.groupStats.length === 0 ? (
            <div className="text-muted text-xs">没有分组</div>
          ) : (
            <ul className="space-y-2">
              {stats.groupStats.map((g) => (
                <li key={g.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span>{g.icon} {g.name}</span>
                    <span className="text-muted">{g.done}/{g.total}</span>
                  </div>
                  <div className="h-2 rounded-pill bg-soft/40 overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${g.rate}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function KpiCard({ icon: Icon, color, label, value }) {
  return (
    <div className="bg-card border border-soft rounded-card p-4 flex items-center gap-3 shadow-soft">
      <Icon size={28} className={`text-${color}`} />
      <div>
        <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
        <div className="title-serif text-2xl">{value}</div>
      </div>
    </div>
  )
}

function Heatmap({ heat, max }) {
  const cols = []
  for (let c = 0; c < 8; c++) cols.push(heat.slice(c * 7, c * 7 + 7))

  const shade = (count) => {
    if (count === 0) return 'bg-soft/30'
    const t = count / max
    if (t > 0.66) return 'bg-accent'
    if (t > 0.33) return 'bg-accent/60'
    return 'bg-accent/30'
  }

  return (
    <div className="flex gap-1">
      {cols.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1">
          {col.map((day) => (
            <div
              key={day.key}
              title={`${day.key}: ${day.count} 项完成`}
              className={`w-3 h-3 rounded-sm ${shade(day.count)}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
