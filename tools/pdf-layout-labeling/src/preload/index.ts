import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Block, ImageDataWithBlocks, Condition } from '../types'

// Custom APIs for renderer
const api = {
  getBlocks: (announcement_id: string, page: number): Promise<Block[]> => {
    return ipcRenderer.invoke('get-blocks', announcement_id, page)
  },
  getTableData: (): Promise<{ filename: string; id: number; completed: boolean }[]> => {
    return ipcRenderer.invoke('get-table-data')
  },
  getImage: (filename: string): Promise<ImageDataWithBlocks | null> => {
    return ipcRenderer.invoke('get-image', filename)
  },
  updateBlock: (
    announcement_id: string,
    page: number,
    _id: string,
    update: Partial<Block>
  ): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('update-block', announcement_id, page, _id, update)
  },
  deleteBlock: (
    announcement_id: string,
    page: number,
    _id: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-block', announcement_id, page, _id),
  insertBlock: (
    announcement_id: string,
    page: number,
    block: Block
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('insert-block', announcement_id, page, block),
  updateFileStatus: (
    announcement_id: string,
    page: number,
    completed: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('update-file-status', announcement_id, page, completed)
  },
  getConditions: (announcement_id: string, page: number): Promise<Condition[]> => {
    return ipcRenderer.invoke('get-conditions', announcement_id, page)
  },
  updateCondition: (
    announcement_id: string,
    page: number,
    _id: string,
    update: Partial<Condition>
  ): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('update-condition', announcement_id, page, _id, update)
  },
  deleteCondition: (
    announcement_id: string,
    page: number,
    _id: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-condition', announcement_id, page, _id),
  onNavigate: (callback: (payload: { name: string }) => void) => {
    ipcRenderer.on('navigate', (_event, payload) => callback(payload))
  },
  insertCondition: (condition: Condition): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('insert-condition', condition)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
