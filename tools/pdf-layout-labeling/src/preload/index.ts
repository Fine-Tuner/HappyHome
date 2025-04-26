import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Block, ImageDataWithBlocks } from '../types'

// Custom APIs for renderer
const api = {
  getBlocks: (filename: string): Promise<Block[]> => {
    return ipcRenderer.invoke('get-blocks', filename)
  },
  getTableData: (): Promise<{ filename: string; id: number }[]> => {
    return ipcRenderer.invoke('get-table-data')
  },
  getImageData: (filename: string): Promise<ImageDataWithBlocks | null> => {
    return ipcRenderer.invoke('get-image-data', filename)
  },
  updateBlock: (
    filename: string,
    uid: string,
    update: Partial<Block>
  ): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('update-block', filename, uid, update)
  },
  deleteBlock: (filename: string, uid: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('delete-block', filename, uid),
  insertBlock: (filename: string, block: Block): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('insert-block', filename, block)
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
