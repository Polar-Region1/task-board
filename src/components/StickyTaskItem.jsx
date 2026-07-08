import { dueLabel, isOverdueIso } from '../lib/dateUtils.js'

export default function StickyTaskItem({ task }) {
  const overdue = isOverdueIso(task.dueDate) && !task.completed

  const dotColor =
    task.priority === 'high' ? '#dc2626' :
    task.priority === 'low' ? '#84cc16' :
    '#fb923c'

  return (
    <div
      onClick={() => window.stickyApi?.openTask(task.id)}
      className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/60 rounded transition-colors"
    >
      <div
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />
      <span className="text-[12px] text-body truncate flex-1">
        {task.title || <span className="text-muted italic">（无标题）</span>}
      </span>
      {task.dueDate && (
        <span className={`text-[10px] flex-shrink-0 ${overdue ? 'text-danger' : 'text-muted'}`}>
          {dueLabel(task.dueDate)}
        </span>
      )}
    </div>
  )
}
