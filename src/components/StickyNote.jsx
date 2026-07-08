import { useState, useEffect, useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore.js'
import { isTodayViewTask } from '../lib/filters.js'
import StickyTaskItem from './StickyTaskItem.jsx'

const VIEW_NAMES = {
  inbox: '所有任务',
  today: '今天',
  completed: '已完成'
}

export default function StickyNote({ viewId }) {
  const hydrate = useTaskStore((s) => s.hydrate)
  const loaded = useTaskStore((s) => s.loaded)
  const tasks = useTaskStore((s) => s.tasks)
  const groups = useTaskStore((s) => s.groups)
  const [input, setInput] = useState('')

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (!window.dataApi?.onDataChanged) return
    const off = window.dataApi.onDataChanged(() => hydrate())
    return off
  }, [hydrate])

  const effectiveViewId = viewId || 'today'
  const viewName = VIEW_NAMES[effectiveViewId] || groups.find((g) => g.id === effectiveViewId)?.name || '任务'

  const filteredTasks = useMemo(() => {
    if (effectiveViewId === 'inbox') return tasks.filter((t) => !t.completed)
    if (effectiveViewId === 'today') return tasks.filter(isTodayViewTask)
    return tasks.filter((t) => !t.completed && t.groupId === effectiveViewId)
  }, [tasks, effectiveViewId])

  const submit = () => {
    const t = input.trim()
    if (!t) return
    const today = new Date().toISOString().slice(0, 10)
    const groupId = (effectiveViewId === 'inbox' || effectiveViewId === 'today' || effectiveViewId === 'completed')
      ? 'g_inbox' : effectiveViewId
    window.stickyApi?.addTask({ title: t, dueDate: today, groupId })
    setInput('')
  }

  return (
    <div
      className="w-[280px] h-[320px] rounded-lg flex flex-col overflow-hidden select-none"
      style={{
        background: 'var(--bg-page)',
        border: '1.5px solid var(--border-soft)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        WebkitAppRegion: 'no-drag'
      }}
    >
      {/* Title bar - draggable */}
      <div
        className="h-8 flex items-center justify-between px-3 flex-shrink-0"
        style={{
          WebkitAppRegion: 'drag',
          borderBottom: '1px dashed var(--border-soft)',
          background: 'var(--bg-sidebar)'
        }}
      >
        <div className="flex items-center gap-1.5">
          <span style={{ color: 'var(--accent)', fontSize: 12 }}>★</span>
          <span className="title-serif text-[13px]">{viewName}</span>
        </div>
        <button
          onClick={() => window.close()}
          style={{ WebkitAppRegion: 'no-drag' }}
          className="text-muted hover:text-ink text-xs w-5 h-5 flex items-center justify-center rounded hover:bg-white/60 transition-colors"
          title="关闭"
        >
          ✕
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-auto py-1">
        {filteredTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted text-[11px]">
            ☕ 这里很安静
          </div>
        ) : (
          filteredTasks.map((t) => <StickyTaskItem key={t.id} task={t} />)
        )}
      </div>

      {/* Quick add input */}
      <div
        className="px-3 py-2 flex items-center gap-1.5 flex-shrink-0"
        style={{ borderTop: '1px dashed var(--border-soft)' }}
      >
        <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>+</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="添加任务，回车新建..."
          className="flex-1 bg-transparent outline-none text-[11px] placeholder:text-muted"
          style={{ WebkitAppRegion: 'no-drag' }}
        />
      </div>
    </div>
  )
}
