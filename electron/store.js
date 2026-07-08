import fs from 'fs'
import path from 'path'
import { app } from 'electron'

const DATA_FILE = path.join(app.getPath('userData'), 'data.json')
const TMP_FILE = DATA_FILE + '.tmp'

const DEFAULT_DATA = {
  version: 1,
  groups: [
    { id: 'g_inbox', name: '未分类', icon: '📁', builtin: true }
  ],
  tasks: []
}

function migrate(data) {
  const inbox = data.groups?.find((g) => g.id === 'g_inbox')
  if (inbox) {
    inbox.name = '未分类'
    inbox.icon = '📁'
    inbox.builtin = true
  }
  if (data.tasks) {
    data.tasks.forEach((t, i) => {
      if (typeof t.position !== 'number') {
        t.position = new Date(t.createdAt || Date.now()).getTime() || (i + 1) * 1000
      }
    })
  }
  return data
}

export function read() {
  try {
    if (!fs.existsSync(DATA_FILE)) return DEFAULT_DATA
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!parsed.groups || !parsed.tasks) return DEFAULT_DATA
    return migrate(parsed)
  } catch (err) {
    console.error('[store] read failed, using defaults:', err)
    return DEFAULT_DATA
  }
}

export function write(data) {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(TMP_FILE, DATA_FILE)
    return { ok: true }
  } catch (err) {
    console.error('[store] write failed:', err)
    return { ok: false, error: err.message }
  }
}

export { DATA_FILE }
