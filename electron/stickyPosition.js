import fs from 'fs'
import path from 'path'
import { app, screen } from 'electron'

const POS_FILE = path.join(app.getPath('userData'), 'sticky-position.json')

const DEFAULT = { visible: true, x: null, y: null }

export function readPosition() {
  try {
    if (!fs.existsSync(POS_FILE)) return getDefaultPosition()
    const raw = fs.readFileSync(POS_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return { ...getDefaultPosition(), ...data }
  } catch {
    return getDefaultPosition()
  }
}

export function writePosition(data) {
  try {
    const current = readPosition()
    fs.writeFileSync(POS_FILE, JSON.stringify({ ...current, ...data }, null, 2), 'utf-8')
  } catch (err) {
    console.error('[sticky] writePosition failed:', err)
  }
}

function getDefaultPosition() {
  const { width } = screen.getPrimaryDisplay().workAreaSize
  return { ...DEFAULT, x: width - 280 - 20, y: 20 }
}
