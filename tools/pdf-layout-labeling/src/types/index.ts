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

// Define interface for image data returned by get-image-data
export interface ImageDataWithBlocks {
  data: string
  width: number
  height: number
  blocks: Block[]
}
