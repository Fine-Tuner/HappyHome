import { IpcRenderer } from 'electron'
import type { Block, Condition, ImageDataWithBlocks } from '../../types'

declare global {
  interface Window {
    electron: {
      ipcRenderer: IpcRenderer
    }
    api: {
      getBlocks: (announcement_id: string, page: number) => Promise<Block[]>
      getTableData: () => Promise<{ filename: string; id: number; completed: boolean }[]>
      getImage: (filename: string) => Promise<ImageDataWithBlocks | null>
      updateBlock: (
        filename: string,
        id: string,
        update: Partial<Block>
      ) => Promise<{ success: boolean; error?: string }>
      deleteBlock: (
        filename: string,
        blockId: string
      ) => Promise<{ success: boolean; error?: string }>
      insertBlock: (filename: string, block: Block) => Promise<{ success: boolean; error?: string }>
      updateFileStatus: (
        filename: string,
        completed: boolean
      ) => Promise<{ success: boolean; error?: string }>
      getConditions: (announcement_id: string, page: number) => Promise<Condition[]>
      updateCondition: (
        announcement_id: string,
        page: number,
        _id: string,
        update: Partial<Condition>
      ) => Promise<{ success: boolean; error?: string }>
      deleteCondition: (
        announcement_id: string,
        page: number,
        _id: string
      ) => Promise<{ success: boolean; error?: string }>
      insertCondition: (condition: Condition) => Promise<{ success: boolean; error?: string }>
    }
  }
}
