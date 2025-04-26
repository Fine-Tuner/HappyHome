import { IpcRenderer } from 'electron'
import type { Block } from '../../types'

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer
    }
    api: {
      getImageData: (filename: string) => Promise<ImageDataWithBlocks | null>
      updateBlock: (filename: string, id: string, update: Partial<Block>) => Promise<void>
      deleteBlock: (
        filename: string,
        blockId: string
      ) => Promise<{ success: boolean; error?: string }>
      insertBlock: (filename: string, block: Block) => Promise<{ success: boolean; error?: string }>
    }
  }
}
