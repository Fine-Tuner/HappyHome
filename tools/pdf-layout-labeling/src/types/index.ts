export enum BlockType {
  TITLE = 0,
  PLAIN_TEXT = 1,
  ABANDON = 2,
  FIGURE = 3,
  FIGURE_CAPTION = 4,
  TABLE = 5,
  TABLE_CAPTION = 6,
  TABLE_FOOTNOTE = 7,
  ISOLATE_FORMULA = 8,
  FORMULA_CAPTION = 9
}

// Define a shared interface for Block data
export interface Block {
  uid: string
  filename: string
  type: BlockType
  bbox: number[]
}

export interface ImageData {
  data: string
  width: number
  height: number
}

export interface ImageDataWithSomething {
  filename: string
  announcement_id: string
  page: number
  image: HTMLImageElement
  width: number
  height: number
}

export interface ImageDataWithBlocks extends ImageDataWithSomething {
  blocks: Block[]
  completed: boolean
}

export interface ImageDataWithConditions extends ImageDataWithSomething {
  conditions: Condition[]
  completed: boolean
}

export interface Condition {
  _id: string
  announcement_id: string
  llm_output_id: string
  category_id: string
  content: string
  section: string
  page: number
  bbox: number[][] // normalized bbox, nested array of [x1, y1, x2, y2]
  created_at: string // ISO string for datetime
}
