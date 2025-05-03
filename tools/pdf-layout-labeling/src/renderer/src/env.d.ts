/// <reference types="vite/client" />

import { Block } from '../../types'

declare global {
  interface Window {
    api: {
      getBlocks: (announcement_id: string, page: number) => Promise<Block[]>
      getTableData: () => Promise<{ filename: string; id: number; completed: boolean }[]>
      getImageData: (announcement_id: string, page: number) => Promise<ImageDataWithBlocks | null>
      updateBlock: (
        announcement_id: string,
        page: number,
        _id: string,
        update: Partial<Block>
      ) => Promise<{ success: boolean; error?: string }>
      deleteBlock: (
        announcement_id: string,
        page: number,
        _id: string
      ) => Promise<{ success: boolean; error?: string }>
      insertBlock: (
        announcement_id: string,
        page: number,
        block: Block
      ) => Promise<{ success: boolean; error?: string }>
      updateFileStatus: (
        announcement_id: string,
        page: number,
        completed: boolean
      ) => Promise<{ success: boolean; error?: string }>
    }
  }
}

export {}
