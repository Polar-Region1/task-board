import { describe, test, expect } from 'vitest'
import { dueLabel, isTodayIso, isOverdueIso, fmtDateLong } from '../src/lib/dateUtils.js'
import { format, addDays } from 'date-fns'

const iso = (d) => format(d, 'yyyy-MM-dd')

describe('dateUtils', () => {
  test('isTodayIso true on today', () => {
    expect(isTodayIso(iso(new Date()))).toBe(true)
  })
  test('isTodayIso false on past', () => {
    expect(isTodayIso(iso(addDays(new Date(), -1)))).toBe(false)
  })
  test('isOverdueIso true for yesterday', () => {
    expect(isOverdueIso(iso(addDays(new Date(), -1)))).toBe(true)
  })
  test('isOverdueIso false for today', () => {
    expect(isOverdueIso(iso(new Date()))).toBe(false)
  })
  test('dueLabel returns "今天"', () => {
    expect(dueLabel(iso(new Date()))).toBe('今天')
  })
  test('dueLabel returns "明天"', () => {
    expect(dueLabel(iso(addDays(new Date(), 1)))).toBe('明天')
  })
  test('dueLabel returns "逾期 X 天"', () => {
    expect(dueLabel(iso(addDays(new Date(), -3)))).toBe('逾期 3 天')
  })
})
