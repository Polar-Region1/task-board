import { describe, test, expect } from 'vitest'
import { applyFilters, allTags, isTodayViewTask } from '../src/lib/filters.js'
import { format, addDays } from 'date-fns'

const iso = (d) => format(d, 'yyyy-MM-dd')
const today = iso(new Date())
const tomorrow = iso(addDays(new Date(), 1))

const sample = [
  { id: 't1', groupId: 'g_inbox', title: '写算法',  completed: false, priority: 'high',   dueDate: null,     tags: ['计划'] },
  { id: 't2', groupId: 'g_inbox', title: '吃药',    completed: true,  priority: 'normal', dueDate: today,    tags: [], completedAt: new Date().toISOString() },
  { id: 't3', groupId: 'g_xx',    title: '开会',    completed: false, priority: 'normal', dueDate: today,    tags: ['工作'] },
  { id: 't4', groupId: 'g_xx',    title: '看论文',  completed: false, priority: 'normal', dueDate: tomorrow, tags: ['学习'] }
]

describe('applyFilters', () => {
  test('today: high priority + today + overdue, exclude completed', () => {
    const r = applyFilters(sample, { view: 'today' })
    const ids = r.map((t) => t.id).sort()
    expect(ids).toEqual(['t1', 't3'])
  })
  test('inbox: all not-completed tasks regardless of group', () => {
    const r = applyFilters(sample, { view: 'inbox' })
    expect(r.map((t) => t.id).sort()).toEqual(['t1', 't3', 't4'])
  })
  test('completed view', () => {
    const r = applyFilters(sample, { view: 'completed' })
    expect(r.map((t) => t.id)).toEqual(['t2'])
  })
  test('custom group view', () => {
    const r = applyFilters(sample, { view: 'g_xx' })
    expect(r.map((t) => t.id).sort()).toEqual(['t3', 't4'])
  })
  test('searchQuery matches title', () => {
    const r = applyFilters(sample, { view: 'inbox', searchQuery: '算法' })
    expect(r.map((t) => t.id)).toEqual(['t1'])
  })
  test('searchQuery #tag matches tags', () => {
    const r = applyFilters(sample, { view: 'inbox', searchQuery: '#学习' })
    expect(r.map((t) => t.id)).toEqual(['t4'])
  })
  test('activeTag filter', () => {
    const r = applyFilters(sample, { view: 'inbox', activeTag: '工作' })
    expect(r.map((t) => t.id)).toEqual(['t3'])
  })
})

describe('allTags', () => {
  test('returns unique sorted tag list', () => {
    expect(allTags(sample)).toEqual(['学习', '工作', '计划'])
  })
})

describe('isTodayViewTask', () => {
  test('includes high-priority tasks', () => {
    expect(isTodayViewTask({ completed: false, priority: 'high', dueDate: null })).toBe(true)
  })
  test('includes tasks due today', () => {
    expect(isTodayViewTask({ completed: false, priority: 'normal', dueDate: today })).toBe(true)
  })
  test('includes overdue tasks', () => {
    const past = iso(addDays(new Date(), -3))
    expect(isTodayViewTask({ completed: false, priority: 'normal', dueDate: past })).toBe(true)
  })
  test('excludes completed tasks', () => {
    expect(isTodayViewTask({ completed: true, priority: 'high', dueDate: today })).toBe(false)
  })
  test('excludes normal future tasks', () => {
    expect(isTodayViewTask({ completed: false, priority: 'normal', dueDate: tomorrow })).toBe(false)
  })
})
