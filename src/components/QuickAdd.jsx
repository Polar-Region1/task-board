import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore.js'

export default function QuickAdd() {
  const addTask = useTaskStore((s) => s.addTask)
  const activeView = useTaskStore((s) => s.activeView)
  const groups = useTaskStore((s) => s.groups)
  const [title, setTitle] = useState('')

  const targetGroupId = () => {
    if (groups.find((g) => g.id === activeView)) return activeView
    return 'g_inbox'
  }

  const submit = () => {
    const t = title.trim()
    if (!t) return
    const due = activeView === 'today'
      ? new Date().toISOString().slice(0, 10)
      : null
    addTask({ title: t, groupId: targetGroupId(), dueDate: due })
    setTitle('')
  }

  return (
    <div className="px-6 pb-6">
      <div className="flex items-center gap-2 bg-card border border-soft rounded-card px-3 py-2.5 shadow-soft focus-within:border-accent transition">
        <Plus size={16} className="text-accent" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="添加任务，回车新建..."
          className="flex-1 bg-transparent outline-none text-[13px] placeholder:text-muted"
        />
        {title && (
          <button
            onClick={submit}
            className="text-xs px-3 py-1 rounded-pill bg-accent text-white hover:bg-accent-strong"
          >
            添加
          </button>
        )}
      </div>
    </div>
  )
}
