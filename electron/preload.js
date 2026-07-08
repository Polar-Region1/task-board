import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('dataApi', {
  read: () => ipcRenderer.invoke('data:read'),
  write: (data) => ipcRenderer.invoke('data:write', data),
  openDataDir: () => ipcRenderer.invoke('data:open-dir'),
  onDataChanged: (handler) => {
    const fn = () => handler()
    ipcRenderer.on('data:changed', fn)
    return () => ipcRenderer.removeListener('data:changed', fn)
  },
  onStickyAddTask: (handler) => {
    const fn = (_e, partial) => handler(partial)
    ipcRenderer.on('sticky:execute-add-task', fn)
    return () => ipcRenderer.removeListener('sticky:execute-add-task', fn)
  },
  onStickyToggleTask: (handler) => {
    const fn = (_e, taskId) => handler(taskId)
    ipcRenderer.on('sticky:execute-toggle-task', fn)
    return () => ipcRenderer.removeListener('sticky:execute-toggle-task', fn)
  }
})

contextBridge.exposeInMainWorld('winApi', {
  minimize: () => ipcRenderer.invoke('win:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('win:toggle-maximize'),
  close: () => ipcRenderer.invoke('win:close'),
  isMaximized: () => ipcRenderer.invoke('win:is-maximized'),
  onMaximizeStateChange: (handler) => {
    const fn = (_e, state) => handler(state.maximized)
    ipcRenderer.on('win:state', fn)
    return () => ipcRenderer.removeListener('win:state', fn)
  }
})

contextBridge.exposeInMainWorld('stickyApi', {
  close: () => ipcRenderer.invoke('sticky:close'),
  savePosition: (pos) => ipcRenderer.invoke('sticky:position', pos),
  openTask: (id) => ipcRenderer.invoke('task:open', id),
  onTaskOpen: (handler) => {
    const fn = (_e, taskId) => handler(taskId)
    ipcRenderer.on('task:open', fn)
    return () => ipcRenderer.removeListener('task:open', fn)
  },
  addTask: (partial) => ipcRenderer.invoke('sticky:add-task', partial),
  toggleTask: (id) => ipcRenderer.invoke('sticky:toggle-task', id)
})

contextBridge.exposeInMainWorld('floatingApi', {
  create: (viewId, name) => ipcRenderer.invoke('floating:create', viewId, name),
  showPreview: (html, x, y) => ipcRenderer.invoke('preview:show', html, x, y),
  movePreview: (x, y) => ipcRenderer.invoke('preview:move', x, y),
  hidePreview: () => ipcRenderer.invoke('preview:hide')
})
