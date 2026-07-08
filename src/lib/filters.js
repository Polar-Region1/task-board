import { isTodayIso, isOverdueIso } from './dateUtils.js'

export function isTodayViewTask(task) {
  return !task.completed && (
    isTodayIso(task.dueDate) || task.priority === 'high' || isOverdueIso(task.dueDate)
  )
}

export function applyFilters(tasks, { view, searchQuery, activeTag }) {
  let result = tasks

  switch (view) {
    case 'today':
      result = result.filter(isTodayViewTask)
      result.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      break
    case 'inbox':
      result = result.filter((t) => !t.completed)
      result.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      break
    case 'completed':
      result = result
        .filter((t) => t.completed)
        .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))
      break
    case 'stats':
      result = []
      break
    default:
      result = result.filter((t) => t.groupId === view && !t.completed)
      result.sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  if (activeTag) {
    result = result.filter((t) => t.tags?.includes(activeTag))
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    if (q.startsWith('#')) {
      const tag = q.slice(1)
      result = result.filter((t) => t.tags?.some((x) => x.toLowerCase().includes(tag)))
    } else {
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.tags?.some((x) => x.toLowerCase().includes(q))
      )
    }
  }

  return result
}

export function allTags(tasks) {
  const set = new Set()
  for (const t of tasks) {
    for (const tag of t.tags || []) set.add(tag)
  }
  return Array.from(set).sort()
}
