/// <reference types="vite/client" />

import { Block } from '../../types'

declare global {
  interface Window {
    api: {
      getBlocks: (filename: string) => Promise<Block[]>
      getTableData: () => Promise<{ filename: string; id: number; completed: boolean }[]>
      getImageData: (filename: string) => Promise<ImageDataWithBlocks | null>
      updateBlock: (
        filename: string,
        uid: string,
        update: Partial<Block>
      ) => Promise<{ success: boolean; error?: string }>
      deleteBlock: (filename: string, uid: string) => Promise<{ success: boolean; error?: string }>
      insertBlock: (filename: string, block: Block) => Promise<{ success: boolean; error?: string }>
      updateFileStatus: (
        filename: string,
        completed: boolean
      ) => Promise<{ success: boolean; error?: string }>
    }
  }
}

export {}
