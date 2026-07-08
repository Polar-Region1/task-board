import { useEffect } from 'react'
import { useTaskStore } from './store/useTaskStore.js'
import Sidebar from './components/Sidebar.jsx'
import TaskList from './components/TaskList.jsx'
import TaskEditor from './components/TaskEditor.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import TitleBar from './components/TitleBar.jsx'
import StickyNote from './components/StickyNote.jsx'

const hash = window.location.hash
const isSticky = hash === '#sticky'
const floatingMatch = hash.match(/^#floating:(.+)$/)
const floatingViewId = floatingMatch ? floatingMatch[1] : null

export default function App() {
  if (isSticky) return <StickyNote />
  if (floatingViewId) return <StickyNote viewId={floatingViewId} />

  const hydrate = useTaskStore((s) => s.hydrate)
  const loaded = useTaskStore((s) => s.loaded)
  const activeView = useTaskStore((s) => s.activeView)
  const editingTaskId = useTaskStore((s) => s.editingTaskId)

  useEffect(() => { hydrate() }, [hydrate])

  useEffect(() => {
    if (!window.dataApi?.onDataChanged) return
    const off = window.dataApi.onDataChanged(() => hydrate())
    return off
  }, [hydrate])

  useEffect(() => {
    if (!window.stickyApi?.onTaskOpen) return
    const off = window.stickyApi.onTaskOpen((taskId) => {
      useTaskStore.getState().openEditor(taskId)
    })
    return off
  }, [])

  useEffect(() => {
    if (!window.dataApi?.onStickyAddTask) return
    const off = window.dataApi.onStickyAddTask((partial) => {
      useTaskStore.getState().addTask(partial)
    })
    return off
  }, [])

  useEffect(() => {
    if (!window.dataApi?.onStickyToggleTask) return
    const off = window.dataApi.onStickyToggleTask((taskId) => {
      useTaskStore.getState().toggleTask(taskId)
    })
    return off
  }, [])

  return (
    <div className="h-full flex flex-col bg-page">
      <TitleBar />
      {!loaded ? (
        <div className="flex-1 flex items-center justify-center text-muted">加载中...</div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            {activeView === 'stats' ? <StatsPanel /> : <TaskList />}
          </main>
          {editingTaskId && <TaskEditor />}
        </div>
      )}
    </div>
  )
}
