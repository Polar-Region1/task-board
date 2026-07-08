import { Check, Zap, GripVertical } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTaskStore } from '../store/useTaskStore.js'
import { dueLabel, isOverdueIso } from '../lib/dateUtils.js'

export default function TaskItem({ task }) {
  const toggleTask = useTaskStore((s) => s.toggleTask)
  const openEditor = useTaskStore((s) => s.openEditor)
  const setActiveTag = useTaskStore((s) => s.setActiveTag)

  const overdue = isOverdueIso(task.dueDate) && !task.completed

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    willChange: 'transform',
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 50 : 'auto',
    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : undefined
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => openEditor(task.id)}
      className={`group bg-card border border-soft rounded-card p-3 flex items-center gap-3 shadow-soft ${
        isDragging
          ? 'cursor-grabbing border-accent shadow-lift'
          : 'cursor-pointer hover:shadow-lift hover:border-accent'
      } ${task.completed ? 'opacity-50' : ''}`}
    >
      <button
        className="text-muted/40 hover:text-muted cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        onClick={(e) => e.stopPropagation()}
        aria-label="拖拽排序"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); toggleTask(task.id) }}
        className={`w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 flex items-center justify-center transition ${
          task.completed
            ? 'bg-success border-success text-white'
            : 'border-soft hover:border-success'
        }`}
        aria-label="勾选"
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={`text-[13px] ${task.completed ? 'line-through text-muted' : 'text-body'}`}>
          {task.title || <span className="text-muted italic">（无标题）</span>}
        </div>
        {(task.tags?.length > 0) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span
                key={tag}
                onClick={(e) => { e.stopPropagation(); setActiveTag(tag) }}
                className="text-[10px] px-1.5 py-0.5 rounded-pill bg-soft/30 text-body hover:bg-accent hover:text-white transition"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
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
