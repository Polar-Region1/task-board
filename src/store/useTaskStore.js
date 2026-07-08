import { create } from 'zustand'
import { makeId } from '../lib/id.js'

const DEBOUNCE_MS = 300
let saveTimer = null

function debouncedPersist(state) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const { groups, tasks } = state
    window.dataApi?.write({ version: 1, groups, tasks })
  }, DEBOUNCE_MS)
}

export const useTaskStore = create((set, get) => ({
  groups: [],
  tasks: [],
  loaded: false,
  activeView: 'today',
  searchQuery: '',
  activeTag: null,
  editingTaskId: null,

  hydrate: async () => {
    const data = await window.dataApi.read()
    set({
      groups: data.groups || [],
      tasks: data.tasks || [],
      loaded: true
    })
  },

  setActiveView: (view) => set({ activeView: view, activeTag: null, editingTaskId: null }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveTag: (tag) => set({ activeTag: tag }),
  openEditor: (id) => set({ editingTaskId: id }),
  closeEditor: () => set({ editingTaskId: null }),

  addGroup: (name, icon = '📁') => {
    const g = { id: makeId('g'), name, icon, builtin: false }
    set((s) => {
      const next = { ...s, groups: [...s.groups, g] }
      debouncedPersist(next)
      return next
    })
    return g.id
  },
  renameGroup: (id, name) => set((s) => {
    const next = {
      ...s,
      groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g))
    }
    debouncedPersist(next)
    return next
  }),
  deleteGroup: (id) => set((s) => {
    if (s.groups.find((g) => g.id === id)?.builtin) return s
    const next = {
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      tasks: s.tasks.map((t) =>
        t.groupId === id ? { ...t, groupId: 'g_inbox' } : t
      ),
      activeView: s.activeView === id ? 'inbox' : s.activeView
    }
    debouncedPersist(next)
    return next
  }),

  addTask: (partial) => {
    const t = {
      id: makeId('t'),
      groupId: partial.groupId || 'g_inbox',
      title: partial.title || '',
      completed: false,
      completedAt: null,
      priority: partial.priority || 'normal',
      dueDate: partial.dueDate || null,
      tags: partial.tags || [],
      position: Date.now(),
      createdAt: new Date().toISOString()
    }
    set((s) => {
      const next = { ...s, tasks: [...s.tasks, t] }
      debouncedPersist(next)
      return next
    })
    return t.id
  },
  updateTask: (id, patch) => set((s) => {
    const next = {
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t))
    }
    debouncedPersist(next)
    return next
  }),
  toggleTask: (id) => set((s) => {
    const next = {
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : null
            }
          : t
      )
    }
    debouncedPersist(next)
    return next
  }),
  deleteTask: (id) => set((s) => {
    const next = {
      ...s,
      tasks: s.tasks.filter((t) => t.id !== id),
      editingTaskId: s.editingTaskId === id ? null : s.editingTaskId
    }
    debouncedPersist(next)
    return next
  }),
  reorderTasks: (activeId, overId) => set((s) => {
    const oldIdx = s.tasks.findIndex((t) => t.id === activeId)
    const newIdx = s.tasks.findIndex((t) => t.id === overId)
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return s
    const arr = [...s.tasks]
    const [moved] = arr.splice(oldIdx, 1)
    arr.splice(newIdx, 0, moved)
    const updated = arr.map((t, i) => ({ ...t, position: (i + 1) * 1000 }))
    const next = { ...s, tasks: updated }
    debouncedPersist(next)
    return next
  })
}))
