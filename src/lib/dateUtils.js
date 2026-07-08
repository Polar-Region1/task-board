import {
  format, isToday, isPast, isWithinInterval,
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  subWeeks, addDays, parseISO, differenceInCalendarDays
} from 'date-fns'

export function fmtDate(iso) {
  if (!iso) return ''
  return format(parseISO(iso), 'MM-dd')
}

export function fmtDateLong(iso) {
  if (!iso) return ''
  return format(parseISO(iso), 'yyyy-MM-dd')
}

export function isTodayIso(iso) {
  if (!iso) return false
  return isToday(parseISO(iso))
}

export function isOverdueIso(iso) {
  if (!iso) return false
  const d = parseISO(iso)
  return isPast(endOfDay(d)) && !isToday(d)
}

export function dueLabel(iso) {
  if (!iso) return ''
  const d = parseISO(iso)
  if (isToday(d)) return '今天'
  const diff = differenceInCalendarDays(d, new Date())
  if (diff === 1) return '明天'
  if (diff > 1 && diff < 7) return `${diff} 天后`
  if (diff < 0) return `逾期 ${-diff} 天`
  return fmtDateLong(iso)
}

export function thisWeekRange() {
  const now = new Date()
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }),
    end: endOfWeek(now, { weekStartsOn: 1 })
  }
}

export function isInThisWeek(iso) {
  if (!iso) return false
  return isWithinInterval(parseISO(iso), thisWeekRange())
}

export function last8WeeksBuckets() {
  const buckets = []
  for (let i = 7; i >= 0; i--) {
    const ref = subWeeks(new Date(), i)
    buckets.push({
      start: startOfWeek(ref, { weekStartsOn: 1 }),
      end: endOfWeek(ref, { weekStartsOn: 1 }),
      label: format(startOfWeek(ref, { weekStartsOn: 1 }), 'MM-dd')
    })
  }
  return buckets
}

export function heatmapBuckets(days = 56) {
  const today = startOfDay(new Date())
  const buckets = []
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i)
    buckets.push({ date: d, key: format(d, 'yyyy-MM-dd') })
  }
  return buckets
}
