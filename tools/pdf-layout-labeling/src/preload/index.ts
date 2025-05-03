import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Block, ImageDataWithBlocks } from '../types'

// Custom APIs for renderer
const api = {
  getBlocks: (announcement_id: string, page: number): Promise<Block[]> => {
    return ipcRenderer.invoke('get-blocks', announcement_id, page)
  },
  getTableData: (): Promise<{ filename: string; id: number; completed: boolean }[]> => {
    return ipcRenderer.invoke('get-table-data')
  },
  getImageData: (announcement_id: string, page: number): Promise<ImageDataWithBlocks | null> => {
    return ipcRenderer.invoke('get-image-data', announcement_id, page)
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
  }
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
