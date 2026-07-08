import { useMemo, useCallback, useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Check, Zap } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore.js'
import { applyFilters } from '../lib/filters.js'
import { dueLabel, isOverdueIso } from '../lib/dateUtils.js'
import TaskItem from './TaskItem.jsx'
import QuickAdd from './QuickAdd.jsx'
import SearchBar from './SearchBar.jsx'

const TITLES = {
  inbox: '所有任务',
  today: '今天',
  completed: '已完成'
}

export default function TaskList() {
  const tasks = useTaskStore((s) => s.tasks)
  const groups = useTaskStore((s) => s.groups)
  const activeView = useTaskStore((s) => s.activeView)
  const searchQuery = useTaskStore((s) => s.searchQuery)
  const activeTag = useTaskStore((s) => s.activeTag)
  const setActiveTag = useTaskStore((s) => s.setActiveTag)
  const reorderTasks = useTaskStore((s) => s.reorderTasks)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const [activeId, setActiveId] = useState(null)

  const filtered = useMemo(
    () => applyFilters(tasks, { view: activeView, searchQuery, activeTag }),
    [tasks, activeView, searchQuery, activeTag]
  )

  const title = TITLES[activeView] || groups.find((g) => g.id === activeView)?.name || '任务'
  const hideQuickAdd = activeView === 'completed'

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id)
  }, [])

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      reorderTasks(active.id, over.id)
    }
  }, [reorderTasks])

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 pt-5 pb-3 flex items-center gap-3">
        <h1 className="title-serif text-2xl">{title}</h1>
        <span className="text-muted text-xs mt-1">{filtered.length} 项</span>
        <div className="ml-auto flex items-center gap-3">
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="text-xs px-2 py-1 rounded-pill bg-accent text-white"
              title="清除标签筛选"
            >
              #{activeTag} ✕
            </button>
          )}
          <SearchBar />
        </div>
      </header>

      <div className="flex-1 overflow-auto px-6 pb-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted text-sm">
            ☕ 这里很安静
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={filtered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              {filtered.map((t) => <TaskItem key={t.id} task={t} />)}
            </SortableContext>
            <DragOverlay dropAnimation={null}>
              {activeId ? <TaskItemOverlay task={filtered.find((t) => t.id === activeId)} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {!hideQuickAdd && <QuickAdd />}
    </div>
  )
}

function TaskItemOverlay({ task }) {
  if (!task) return null
  const overdue = isOverdueIso(task.dueDate) && !task.completed
  return (
    <div
      className="bg-card border border-accent rounded-card p-3 flex items-center gap-3 shadow-lift opacity-90 cursor-grabbing"
      style={{ width: 'var(--overlay-width, auto)' }}
    >
      <div
        className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center ${
          task.completed
            ? 'bg-success border-success text-white'
            : 'border-soft'
        }`}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] ${task.completed ? 'line-through text-muted' : 'text-body'}`}>
          {task.title || <span className="text-muted italic">（无标题）</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {task.priority === 'high' && (
          <span className="text-danger flex items-center gap-0.5 text-[11px]">
            <Zap size={11} fill="currentColor" />
            高
          </span>
        )}
        {task.dueDate && (
          <span className={`text-[11px] ${overdue ? 'text-danger font-semibold' : 'text-muted'}`}>
            {dueLabel(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  )
}
