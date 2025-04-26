/// <reference types="vite/client" />

import { Block } from '../../types'

declare global {
  interface Window {
    api: {
      getBlocks: (filename: string) => Promise<Block[]>
      getTableData: () => Promise<{ filename: string }[]>
    }
  }
}

export {}
