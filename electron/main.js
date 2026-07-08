import { app, BrowserWindow, ipcMain, shell, Menu, Tray, screen } from 'electron'
import path from 'path'
import * as store from './store.js'
import * as stickyPos from './stickyPosition.js'

const isDev = !app.isPackaged
let mainWin = null
let stickyWin = null
let previewWin = null
let tray = null

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWin) {
      if (mainWin.isMinimized()) mainWin.restore()
      mainWin.focus()
    }
  })

  Menu.setApplicationMenu(null)

  function loadHash(win, hash) {
    if (isDev && process.env['ELECTRON_RENDERER_URL']) {
      win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/#' + hash)
    } else {
      win.loadFile(path.join(__dirname, '../renderer/index.html'), { hash })
    }
  }

  function createTray() {
    tray = new Tray(path.join(__dirname, '../../assets/icons/icon.ico'))
    tray.setToolTip('Task List')

    const contextMenu = Menu.buildFromTemplate([
      { label: '显示主窗口', click: () => showMain() },
      { type: 'separator' },
      { label: '退出', click: () => forceQuit() }
    ])

    tray.setContextMenu(contextMenu)
    tray.on('click', () => showMain())
  }

  function showMain() {
    if (!mainWin) createWindow()
    if (mainWin.isMinimized()) mainWin.restore()
    mainWin.show()
    mainWin.focus()
  }

  function showSticky() {
    if (!stickyWin) createStickyWindow()
    stickyWin.show()
    stickyWin.focus()
  }

  function forceQuit() {
    if (stickyWin) stickyWin.destroy()
    if (mainWin) mainWin.destroy()
    app.quit()
  }

  function createWindow() {
    mainWin = new BrowserWindow({
      width: 1100,
      height: 720,
      minWidth: 900,
      minHeight: 600,
      backgroundColor: '#fef9f0',
      title: 'Task List',
      icon: path.join(__dirname, '../../assets/icons/icon.ico'),
      frame: false,
      titleBarStyle: 'hidden',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    loadHash(mainWin, 'main')

    mainWin.on('maximize', () => mainWin.webContents.send('win:state', { maximized: true }))
    mainWin.on('unmaximize', () => mainWin.webContents.send('win:state', { maximized: false }))

    mainWin.on('close', (e) => {
      e.preventDefault()
      mainWin.hide()
    })

    mainWin.on('closed', () => { mainWin = null })
  }

  function createStickyWindow() {
    const pos = stickyPos.readPosition()

    stickyWin = new BrowserWindow({
      width: 280,
      height: 320,
      x: pos.x,
      y: pos.y,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      resizable: false,
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false
      }
    })

    stickyWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    loadHash(stickyWin, 'sticky')

    let moveTimer = null
    stickyWin.on('move', () => {
      if (moveTimer) clearTimeout(moveTimer)
      moveTimer = setTimeout(() => {
        const bounds = stickyWin.getBounds()
        stickyPos.writePosition({ x: bounds.x, y: bounds.y })
      }, 500)
    })

    stickyWin.on('closed', () => { stickyWin = null })
  }

  app.whenReady().then(() => {
    ipcMain.handle('data:read', () => store.read())
    ipcMain.handle('data:write', (_e, data) => {
      const result = store.write(data)
      BrowserWindow.getAllWindows().forEach((w) => {
        if (w.webContents !== _e.sender) {
          w.webContents.send('data:changed')
        }
      })
      return result
    })
    ipcMain.handle('data:open-dir', () => {
      shell.showItemInFolder(store.DATA_FILE)
      return { ok: true }
    })

    ipcMain.handle('win:minimize', (e) => {
      BrowserWindow.fromWebContents(e.sender)?.minimize()
    })
    ipcMain.handle('win:toggle-maximize', (e) => {
      const w = BrowserWindow.fromWebContents(e.sender)
      if (!w) return
      if (w.isMaximized()) w.unmaximize()
      else w.maximize()
    })
    ipcMain.handle('win:close', (e) => {
      BrowserWindow.fromWebContents(e.sender)?.hide()
    })
    ipcMain.handle('win:is-maximized', (e) => {
      return BrowserWindow.fromWebContents(e.sender)?.isMaximized() ?? false
    })

    ipcMain.handle('sticky:close', (e) => {
      const w = BrowserWindow.fromWebContents(e.sender)
      if (w) w.hide()
    })

    ipcMain.handle('sticky:position', (_e, pos) => {
      stickyPos.writePosition(pos)
    })

    ipcMain.handle('task:open', (_e, taskId) => {
      if (mainWin) {
        if (mainWin.isMinimized()) mainWin.restore()
        mainWin.show()
        mainWin.focus()
        mainWin.webContents.send('task:open', taskId)
      } else {
        createWindow()
        mainWin.webContents.once('did-finish-load', () => {
          mainWin.webContents.send('task:open', taskId)
        })
      }
    })

    ipcMain.handle('floating:create', (_e, viewId, name) => {
      const cursor = screen.getCursorScreenPoint()
      const win = new BrowserWindow({
        width: 280,
        height: 320,
        x: cursor.x - 140,
        y: cursor.y - 20,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        resizable: false,
        backgroundColor: '#00000000',
        webPreferences: {
          preload: path.join(__dirname, '../preload/preload.mjs'),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false
        }
      })
      win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      loadHash(win, `floating:${viewId}`)

      let moveTimer = null
      win.on('move', () => {
        if (moveTimer) clearTimeout(moveTimer)
        moveTimer = setTimeout(() => {
          const bounds = win.getBounds()
          stickyPos.writePosition({ x: bounds.x, y: bounds.y })
        }, 500)
      })
    })

    ipcMain.handle('sticky:add-task', (_e, partial) => {
      if (!mainWin) return { ok: false, error: 'main window not available' }
      mainWin.webContents.send('sticky:execute-add-task', partial)
      return { ok: true }
    })

    ipcMain.handle('sticky:toggle-task', (_e, taskId) => {
      if (!mainWin) return { ok: false, error: 'main window not available' }
      mainWin.webContents.send('sticky:execute-toggle-task', taskId)
      return { ok: true }
    })

    ipcMain.handle('preview:show', (_e, html, x, y) => {
      if (previewWin && !previewWin.isDestroyed()) previewWin.destroy()
      previewWin = new BrowserWindow({
        width: 260,
        height: 200,
        x: Math.round(x),
        y: Math.round(y),
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        transparent: true,
        resizable: false,
        hasShadow: false,
        backgroundColor: '#00000000',
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true
        }
      })
      previewWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
      previewWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      previewWin.showInactive()
    })

    ipcMain.handle('preview:move', (_e, x, y) => {
      if (previewWin && !previewWin.isDestroyed()) {
        previewWin.setPosition(Math.round(x), Math.round(y))
      }
    })

    ipcMain.handle('preview:hide', () => {
      if (previewWin && !previewWin.isDestroyed()) {
        previewWin.destroy()
      }
      previewWin = null
    })

    createTray()
    createWindow()

    app.on('activate', () => {
      showMain()
    })
  })

  app.on('window-all-closed', () => {
    // 不退出——app 藏在托盘里
  })
}
