import { useState, useRef, useEffect } from 'react'
import { Inbox, Star, CheckCheck, BarChart3, Plus, Trash2, Pencil } from 'lucide-react'
import { useTaskStore } from '../store/useTaskStore.js'
import { isTodayViewTask } from '../lib/filters.js'

const SMART_VIEWS = [
  { id: 'inbox',     name: '所有任务', icon: Inbox },
  { id: 'today',     name: '今天',     icon: Star },
  { id: 'completed', name: '已完成',   icon: CheckCheck }
]

const DRAG_THRESHOLD_SQ = 225  // 15px squared

function createPreviewHtml(viewId, name, tasks) {
  let filtered
  if (viewId === 'inbox') filtered = tasks.filter((t) => !t.completed)
  else if (viewId === 'today') filtered = tasks.filter(isTodayViewTask)
  else filtered = tasks.filter((t) => !t.completed && t.groupId === viewId)
  filtered = filtered.slice(0, 4)

  return `<!DOCTYPE html><html><head><style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:transparent; font-family:Inter,'HarmonyOS Sans SC','Microsoft YaHei',sans-serif; }
    .card { width:240px; background:#fef9f0; border:1.5px solid #fed7aa; border-radius:10px; padding:10px 12px; font-size:12px; color:#44403c; box-shadow:0 4px 16px rgba(0,0,0,0.12); }
    .title { font-weight:700; margin-bottom:6px; color:#292524; font-family:Georgia,'KaiTi',serif; }
    .row { padding:2px 0; display:flex; align-items:center; gap:6px; }
    .dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
    .text { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .empty { color:#a8a29e; text-align:center; padding:8px 0; }
    .more { color:#a8a29e; font-size:10px; margin-top:4px; }
  </style></head><body>
    <div class="card">
      <div class="title">★ ${name}</div>
      ${filtered.map((t) => `<div class="row"><div class="dot" style="background:${t.priority === 'high' ? '#dc2626' : '#fb923c'}"></div><div class="text">${t.title || '（无标题）'}</div></div>`).join('')}
      ${filtered.length === 0 ? '<div class="empty">空</div>' : ''}
      ${tasks.filter((t) => !t.completed).length > 4 ? `<div class="more">还有 ${tasks.filter((t) => !t.completed).length - 4} 项...</div>` : ''}
    </div>
  </body></html>`
}

export default function Sidebar() {
  const activeView = useTaskStore((s) => s.activeView)
  const setActiveView = useTaskStore((s) => s.setActiveView)
  const groups = useTaskStore((s) => s.groups)
  const tasks = useTaskStore((s) => s.tasks)
  const addGroup = useTaskStore((s) => s.addGroup)
  const deleteGroup = useTaskStore((s) => s.deleteGroup)
  const renameGroup = useTaskStore((s) => s.renameGroup)
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const dragState = useRef({
    active: false, moved: false,
    startX: 0, startY: 0,
    viewId: '', name: ''
  })

  // Convert clientX/Y to screen coordinates
  const toScreen = (clientX, clientY) => ({
    x: window.screenX + clientX,
    y: window.screenY + (window.outerHeight - window.innerHeight) + clientY
  })

  // Global pointer move/up for drag-to-float
  useEffect(() => {
    const onMove = (e) => {
      const s = dragState.current
      if (!s.active || !s.viewId) return

      if (!s.moved) {
        const dx = e.clientX - s.startX
        const dy = e.clientY - s.startY
        if (dx * dx + dy * dy > DRAG_THRESHOLD_SQ) {
          s.moved = true
          const html = createPreviewHtml(s.viewId, s.name, tasks)
          const pos = toScreen(e.clientX + 12, e.clientY + 12)
          window.floatingApi?.showPreview(html, pos.x, pos.y)
        }
      } else {
        const pos = toScreen(e.clientX + 12, e.clientY + 12)
        window.floatingApi?.movePreview(pos.x, pos.y)
      }
    }

    const onUp = () => {
      const s = dragState.current
      if (s.active && s.moved && s.viewId && window.floatingApi?.create) {
        window.floatingApi.create(s.viewId, s.name)
      }
      if (s.active && s.moved) {
        window.floatingApi?.hidePreview()
      }
      dragState.current = {
        active: false, moved: false,
        startX: 0, startY: 0,
        viewId: '', name: ''
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [tasks])

  const startDrag = (e, viewId, name) => {
    if (e.button !== 0) return
    dragState.current = {
      active: true, moved: false,
      startX: e.clientX, startY: e.clientY,
      viewId, name
    }
  }

  const countFor = (viewId) => {
    if (viewId === 'inbox')     return tasks.filter((t) => !t.completed).length
    if (viewId === 'today')     return tasks.filter(isTodayViewTask).length
    if (viewId === 'completed') return tasks.filter((t) => t.completed).length
    return tasks.filter((t) => t.groupId === viewId && !t.completed).length
  }

  const submitNew = () => {
    const name = newName.trim()
    if (name) addGroup(name)
    setNewName('')
    setAdding(false)
  }

  const customGroups = groups.filter((g) => g.id !== 'g_inbox')

  return (
    <aside className="w-[220px] bg-sidebar border-r border-soft py-3 flex flex-col h-full">
      <div className="px-3 mb-3">
        <h2 className="title-serif text-lg">📝 Task List</h2>
      </div>

      <div className="px-2 space-y-0.5">
        <div className="text-muted uppercase text-[10px] tracking-wider px-2 mb-1">智能视图</div>
        {SMART_VIEWS.map((v) => {
          const Icon = v.icon
          const active = activeView === v.id
          const c = countFor(v.id)
          return (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-pill text-left transition ${
                active ? 'bg-accent text-white font-semibold' : 'text-body hover:bg-white'
              }`}
            >
              <Icon size={14} />
              <span className="flex-1 truncate">{v.name}</span>
              <span className={`text-[10px] tabular-nums ${active ? 'opacity-80' : 'text-muted'}`}>{c}</span>
            </button>
          )
        })}
      </div>

      <div className="px-2 mt-4 space-y-0.5 flex-1 overflow-auto">
        <div className="text-muted uppercase text-[10px] tracking-wider px-2 mb-1 flex items-center">
          <span>分组</span>
          <button
            onClick={() => setAdding(true)}
            className="ml-auto text-muted hover:text-accent"
            title="新建分组"
          >
            <Plus size={12} />
          </button>
        </div>
        {customGroups.map((g) => {
          const active = activeView === g.id
          const c = countFor(g.id)
          return (
            <GroupRow
              key={g.id}
              group={g}
              active={active}
              count={c}
              onClick={() => setActiveView(g.id)}
              onDragStart={(e) => startDrag(e, g.id, g.name)}
              onRename={(name) => renameGroup(g.id, name)}
              onDelete={() => {
                if (confirm(`删除分组「${g.name}」？组内任务会移到"未分类"。`)) deleteGroup(g.id)
              }}
            />
          )
        })}
        {adding && (
          <div className="px-2 py-1">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={submitNew}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew()
                if (e.key === 'Escape') { setAdding(false); setNewName('') }
              }}
              placeholder="新分组名"
              className="w-full text-xs px-2 py-1 rounded-pill border border-soft bg-white outline-none focus:border-accent"
            />
          </div>
        )}
      </div>

      <div className="px-2 pt-2 border-t border-soft">
        <button
          onClick={() => setActiveView('stats')}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-pill text-left transition ${
            activeView === 'stats' ? 'bg-accent text-white font-semibold' : 'text-body hover:bg-white'
          }`}
        >
          <BarChart3 size={14} />
          <span>统计</span>
        </button>
      </div>
    </aside>
  )
}

function GroupRow({ group, active, count, onClick, onDragStart, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)

  if (editing) {
    return (
      <div className="px-2 py-1">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { if (name.trim()) onRename(name.trim()); setEditing(false) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { if (name.trim()) onRename(name.trim()); setEditing(false) }
            if (e.key === 'Escape') { setName(group.name); setEditing(false) }
          }}
          className="w-full text-xs px-2 py-1 rounded-pill border border-soft bg-white outline-none focus:border-accent"
        />
      </div>
    )
  }

  return (
    <div
      onPointerDown={onDragStart}
      className={`group w-full flex items-center rounded-pill text-left transition cursor-grab active:cursor-grabbing ${
        active ? 'bg-accent text-white font-semibold' : 'text-body hover:bg-white'
      }`}
    >
      {/* Clickable group name */}
      <button
        onClick={onClick}
        className="flex-1 flex items-center gap-2 min-w-0 px-2 py-1 cursor-pointer"
      >
        <span className="shrink-0">{group.icon || '📁'}</span>
        <span className="truncate">{group.name}</span>
        <span className={`text-[10px] tabular-nums shrink-0 ${active ? 'opacity-80' : 'text-muted'}`}>{count}</span>
      </button>

      {/* Edit / Delete — always reachable via CSS hover on .group parent */}
      <div className={`flex items-center gap-0.5 shrink-0 pr-1 opacity-0 group-hover:opacity-100 transition ${
        active ? 'text-white' : ''
      }`}>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setEditing(true) }}
          className={`p-0.5 rounded transition ${
            active ? 'hover:bg-white/20' : 'hover:text-accent'
          }`}
          title="重命名"
        >
          <Pencil size={11} />
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className={`p-0.5 rounded transition ${
            active ? 'hover:bg-white/20' : 'hover:text-danger'
          }`}
          title="删除"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}
