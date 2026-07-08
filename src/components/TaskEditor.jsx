import { useState, useEffect, useMemo } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { X, Trash2, Calendar, Tag, Zap, FolderInput } from 'lucide-react'
import { format, parseISO, addDays } from 'date-fns'
import { useTaskStore } from '../store/useTaskStore.js'
import { allTags } from '../lib/filters.js'

export default function TaskEditor() {
  const editingTaskId = useTaskStore((s) => s.editingTaskId)
  const tasks = useTaskStore((s) => s.tasks)
  const task = useMemo(
    () => tasks.find((t) => t.id === editingTaskId),
    [tasks, editingTaskId]
  )
  const groups = useTaskStore((s) => s.groups)
  const allOtherTags = useMemo(() => allTags(tasks), [tasks])
  const updateTask = useTaskStore((s) => s.updateTask)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const closeEditor = useTaskStore((s) => s.closeEditor)

  const [title, setTitle] = useState('')
  const [showCal, setShowCal] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (task) setTitle(task.title)
  }, [editingTaskId])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        const tag = e.target?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') {
          e.target.blur()
        } else {
          closeEditor()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeEditor])

  const tagSuggestions = useMemo(() => {
    const q = tagInput.trim()
    if (!q) return []
    return allOtherTags.filter((t) =>
      t.toLowerCase().includes(q.toLowerCase()) && !task?.tags?.includes(t)
    ).slice(0, 5)
  }, [tagInput, allOtherTags, task])

  if (!task) return null

  const commit = (patch) => updateTask(task.id, patch)
  const commitTitle = () => {
    const t = title.trim()
    if (t !== task.title) commit({ title: t })
  }
  const addTag = (tag) => {
    const t = tag.trim()
    if (!t || task.tags?.includes(t)) return
    commit({ tags: [...(task.tags || []), t] })
    setTagInput('')
  }
  const removeTag = (tag) => {
    commit({ tags: task.tags.filter((x) => x !== tag) })
  }

  return (
    <aside className="w-[360px] border-l border-soft bg-page flex flex-col h-full">
      <header className="px-4 py-3 flex items-center border-b border-soft">
        <h3 className="title-serif text-lg">编辑任务</h3>
        <button
          onClick={closeEditor}
          className="ml-auto text-muted hover:text-ink"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          placeholder="任务标题"
          rows={2}
          className="w-full text-[14px] font-semibold bg-card border border-soft rounded-card p-3 outline-none focus:border-accent resize-none"
        />

        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Zap size={12} /> 优先级
          </div>
          <div className="flex gap-2">
            {['low', 'normal', 'high'].map((p) => {
              const active = task.priority === p
              const label = p === 'low' ? '低' : p === 'normal' ? '普通' : '高'
              return (
                <button
                  key={p}
                  onClick={() => commit({ priority: p })}
                  className={`flex-1 text-xs py-1.5 rounded-pill border transition ${
                    active
                      ? 'bg-accent text-white border-accent'
                      : 'bg-card border-soft text-body hover:border-accent'
                  }`}
                >
                  {p === 'high' && '⚡'} {label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar size={12} /> 截止日期
          </div>
          <div className="flex gap-2 mb-2">
            <QuickDateBtn label="今天" onClick={() => commit({ dueDate: format(new Date(), 'yyyy-MM-dd') })} />
            <QuickDateBtn label="明天" onClick={() => commit({ dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd') })} />
            <QuickDateBtn label="下周" onClick={() => commit({ dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd') })} />
            {task.dueDate && (
              <button onClick={() => commit({ dueDate: null })} className="text-xs px-2 py-1 rounded-pill text-muted hover:text-danger">
                清除
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCal((v) => !v)}
            className="w-full text-left text-xs px-3 py-2 rounded-card border border-soft bg-card hover:border-accent"
          >
            {task.dueDate ? format(parseISO(task.dueDate), 'yyyy-MM-dd') : '选个日期...'}
          </button>
          {showCal && (
            <div className="mt-2 p-2 rounded-card border border-soft bg-card">
              <DayPicker
                mode="single"
                selected={task.dueDate ? parseISO(task.dueDate) : undefined}
                onSelect={(d) => {
                  commit({ dueDate: d ? format(d, 'yyyy-MM-dd') : null })
                  setShowCal(false)
                }}
              />
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Tag size={12} /> 标签
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {(task.tags || []).map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-pill bg-soft/40 text-body flex items-center gap-1">
                #{tag}
                <button onClick={() => removeTag(tag)} className="text-muted hover:text-danger">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tagInput.trim()) {
                e.preventDefault()
                addTag(tagInput)
              }
            }}
            placeholder="输入标签，回车添加"
            className="w-full text-xs px-3 py-2 rounded-pill border border-soft bg-card outline-none focus:border-accent"
          />
          {tagSuggestions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {tagSuggestions.map((t) => (
                <button
                  key={t}
                  onClick={() => addTag(t)}
                  className="text-[11px] px-2 py-0.5 rounded-pill bg-card border border-soft text-muted hover:border-accent hover:text-accent"
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-[11px] text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <FolderInput size={12} /> 分组
          </div>
          <select
            value={task.groupId}
            onChange={(e) => commit({ groupId: e.target.value })}
            className="w-full text-xs px-3 py-2 rounded-card border border-soft bg-card outline-none focus:border-accent"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <footer className="px-4 py-3 border-t border-soft">
        <button
          onClick={() => {
            if (confirm('删除该任务？')) {
              deleteTask(task.id)
            }
          }}
          className="w-full text-xs py-2 rounded-pill border border-soft text-danger hover:bg-danger hover:text-white hover:border-danger transition flex items-center justify-center gap-2"
        >
          <Trash2 size={12} /> 删除任务
        </button>
      </footer>
    </aside>
  )
}

function QuickDateBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2 py-1 rounded-pill border border-soft bg-card text-body hover:border-accent hover:text-accent transition"
    >
      {label}
    </button>
  )
}
