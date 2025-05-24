<template>
  <div class="container">
    <div class="table-container">
      <v-btn v-if="tableData.length === 0" class="load-table-data-btn" @click="loadTableData">
        Open Directory
      </v-btn>
      <FileListTable
        v-else
        ref="table"
        :columns="tableColumns"
        :table-data="tableData"
        @row-id-change="loadImage"
      ></FileListTable>
    </div>
    <div ref="imageContainerRef" class="image-container">
      <BlockLabelingLayer
        v-if="imageDataWithBlocks"
        :image="imageDataWithBlocks.image"
        :width="imageDataWithBlocks.width"
        :height="imageDataWithBlocks.height"
        :blocks="imageDataWithBlocks.blocks"
        :container-width="containerWidth"
        :container-height="containerHeight"
        @update:block-type="handleBlockTypeUpdate"
        @update:block-bbox="handleBlockBboxUpdate"
        @delete:block="handleDeleteBlock"
      />
      <v-btn
        v-if="imageDataWithBlocks"
        size="small"
        :color="imageDataWithBlocks.completed ? 'grey' : 'success'"
        class="complete-btn"
        @click="
          handleStatusUpdate(
            imageDataWithBlocks.announcement_id,
            imageDataWithBlocks.page,
            imageDataWithBlocks.filename,
            !imageDataWithBlocks.completed
          )
        "
      >
        {{ imageDataWithBlocks.completed ? 'Mark as Incomplete' : 'Mark as Complete' }}
      </v-btn>
      <v-btn size="small" v-if="imageDataWithBlocks" @click="createNewBlock" class="add-block-btn"
        >Add Block</v-btn
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import BlockLabelingLayer from '@renderer/components/BlockLabelingLayer.vue'
import FileListTable from '@renderer/components/FileListTable.vue'
import type { Block, ImageDataWithBlocks } from '@/types'
import { BlockType } from '@/types'
import { ref, onMounted, onUnmounted } from 'vue'
import { parseFilename } from '@/common/utils' // Import shared function

// Define the expected structure for table data, including the new field
interface TableRow {
  id: number // Keep id if needed for Tabulator
  filename: string
  completed: boolean
}

const imageDataWithBlocks = ref<ImageDataWithBlocks | null>(null)
const table = ref<InstanceType<typeof FileListTable> | null>(null)
const tableData = ref<TableRow[]>([])
const imageContainerRef = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)
let resizeObserver: ResizeObserver | null = null

const tableColumns = [
  {
    title: 'Filename',
    field: 'filename',
    resizable: false,
    hozAlign: 'center',
    headerHozAlign: 'center',
    headerFilter: 'input'
  },
  {
    title: 'Done',
    field: 'completed',
    formatter: 'tickCross', // Use Tabulator's built-in tick/cross formatter
    formatterParams: {
      allowEmpty: false, // Display false as a cross
      tickElement: '✔',
      crossElement: '✖'
    },
    width: 80,
    hozAlign: 'center',
    headerHozAlign: 'center',
    cellClick: async (_e, cell) => {
      // Toggle the status when the cell is clicked
      const rowData = cell.getRow().getData() as TableRow
      const newStatus = !rowData.completed
      const parsed = parseFilename(rowData.filename)
      if (!parsed) {
        console.error(`[LayoutLabelingView] Invalid filename format received: ${rowData.filename}`)
        return
      }
      const { announcement_id, page } = parsed
      await handleStatusUpdate(announcement_id, page, rowData.filename, newStatus)
    }
  }
]

async function loadTableData(): Promise<void> {
  const data = await window.api.getTableData()
  tableData.value = data
}

async function loadImage(row: TableRow): Promise<void> {
  const parsed = parseFilename(row.filename)
  if (!parsed) {
    imageDataWithBlocks.value = null
    return
  }
  const { announcement_id, page } = parsed

  const image: ImageData | null = await window.api.getImage(row.filename)
  const blocks: Block[] | null = await window.api.getBlocks(announcement_id, page)

  if (image) {
    const imgObj = new Image()
    imgObj.onload = () => {
      imageDataWithBlocks.value = {
        filename: row.filename,
        announcement_id: announcement_id,
        page: page,
        image: imgObj,
        width: image.width,
        height: image.height,
        blocks: blocks,
        completed: row.completed
      }
    }
    imgObj.onerror = (err) => {
      console.error('Error loading image:', err)
      imageDataWithBlocks.value = null
    }
    imgObj.src = `data:image/png;base64,${image.data}`
  } else {
    imageDataWithBlocks.value = null
  }
}

async function handleBlockTypeUpdate(_id: string, newType: BlockType): Promise<void> {
  if (!imageDataWithBlocks.value || !imageDataWithBlocks.value.blocks) return

  const block = imageDataWithBlocks.value.blocks.find((b) => b._id === _id) // Use id
  if (block) {
    const { announcement_id, page } = imageDataWithBlocks.value // Get identifiers
    const originalType = block.type
    block.type = newType
    try {
      const result = await window.api.updateBlock(announcement_id, page, _id, { type: newType })
      if (result?.success) {
        console.log(`Updated type for block ${_id} to ${newType}`)
      } else {
        console.error(`Failed to update block type for ${_id} on backend.`)
        block.type = originalType
      }
    } catch (error) {
      console.error(`Error calling updateBlock for type update on ${_id}:`, error)
      block.type = originalType
    }
  } else {
    console.warn(`Block with id ${_id} not found for type update.`)
  }
}

async function handleBlockBboxUpdate(
  _id: string,
  newBbox: [number, number, number, number]
): Promise<void> {
  if (!imageDataWithBlocks.value || !imageDataWithBlocks.value.blocks) return

  const block = imageDataWithBlocks.value.blocks.find((b) => b._id === _id)
  if (block) {
    const { announcement_id, page } = imageDataWithBlocks.value
    const originalBbox = [...block.bbox]
    block.bbox = newBbox
    try {
      const result = await window.api.updateBlock(announcement_id, page, _id, { bbox: newBbox })
      if (result?.success) {
        console.log(`Updated bbox for block ${_id}`)
      } else {
        console.error(`Failed to update block bbox for ${_id} on backend.`)
        block.bbox = originalBbox as [number, number, number, number]
      }
    } catch (error) {
      console.error(`Error calling updateBlock for bbox update on ${_id}:`, error)
      block.bbox = originalBbox as [number, number, number, number]
    }
  } else {
    console.warn(`Block with _id ${_id} not found for bbox update.`)
  }
}

async function handleDeleteBlock(_id: string): Promise<void> {
  if (!imageDataWithBlocks.value || !imageDataWithBlocks.value.blocks) return

  const blockIndex = imageDataWithBlocks.value.blocks.findIndex((b) => b._id === _id)

  if (blockIndex !== -1) {
    const { announcement_id, page } = imageDataWithBlocks.value
    const blockToRemove = { ...imageDataWithBlocks.value.blocks[blockIndex] }

    imageDataWithBlocks.value.blocks.splice(blockIndex, 1)

    try {
      const result = await window.api.deleteBlock(announcement_id, page, _id)
      if (result.success) {
        console.log(`Deleted block ${_id}`)
      } else {
        console.error(`Failed to delete block ${_id} on backend.`)
        imageDataWithBlocks.value.blocks.splice(blockIndex, 0, blockToRemove)
      }
    } catch (error) {
      console.error(`Error calling deleteBlock for ${_id}:`, error)
      imageDataWithBlocks.value.blocks.splice(blockIndex, 0, blockToRemove)
    }
  } else {
    console.warn(`Block with _id ${_id} not found for deletion.`)
  }
}

async function createNewBlock(): Promise<void> {
  if (!imageDataWithBlocks.value) {
    console.error('Cannot add block: No image data loaded.')
    return
  }

  const { announcement_id, page } = imageDataWithBlocks.value // Get identifiers

  const newBlock: Block = {
    _id: crypto.randomUUID(),
    announcement_id: announcement_id,
    page: page,
    bbox: [0.1, 0.1, 0.2, 0.2],
    type: BlockType.PLAIN_TEXT,
    confidence: 1.0,
    model: 'manual'
  }

  try {
    const result = await window.api.insertBlock(newBlock)
    if (result.success) {
      imageDataWithBlocks.value.blocks.push(newBlock)
      console.log(`Successfully added block ${newBlock._id}`)
    } else {
      console.error(`Failed to add block ${newBlock._id} on backend:`, result.error)
    }
  } catch (error) {
    console.error(`Error calling insertBlock for new block ${newBlock._id}:`, error)
  }
}

async function handleStatusUpdate(
  announcement_id: string,
  page: number,
  filename: string,
  newStatus: boolean
): Promise<void> {
  try {
    const result = await window.api.updateFileStatus(announcement_id, page, newStatus)
    if (result.success) {
      const rowIndex = tableData.value.findIndex((row) => row.filename === filename)
      if (rowIndex !== -1) {
        tableData.value[rowIndex].completed = newStatus
      }

      if (imageDataWithBlocks.value && imageDataWithBlocks.value.filename === filename) {
        imageDataWithBlocks.value.completed = newStatus
      }

      console.log(
        `Updated status for ${filename} (ann: ${announcement_id}, page: ${page}) to ${newStatus}`
      )
    } else {
      console.error(`Failed to update status for ${filename} on backend:`, result.error)
    }
  } catch (error) {
    console.error(`Error calling updateFileStatus for ${filename}:`, error)
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    return
  }

  if (imageDataWithBlocks.value && event.key.toLowerCase() === 'd') {
    console.log('"d" key pressed, toggling completion status.')
    handleStatusUpdate(
      imageDataWithBlocks.value.announcement_id,
      imageDataWithBlocks.value.page,
      imageDataWithBlocks.value.filename,
      !imageDataWithBlocks.value.completed
    )
  }
}

onMounted(() => {
  if (imageContainerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
        containerHeight.value = entry.contentRect.height
      }
    })
    resizeObserver.observe(imageContainerRef.value)
    // Initial size
    containerWidth.value = imageContainerRef.value.clientWidth
    containerHeight.value = imageContainerRef.value.clientHeight
  }
  // Add keydown listener
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (resizeObserver && imageContainerRef.value) {
    resizeObserver.unobserve(imageContainerRef.value)
  }
  resizeObserver = null
  // Remove keydown listener
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.load-table-data-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.add-block-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20; /* Ensure it's above the canvas/overlays */
}

.complete-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20; /* Ensure it's above the canvas/overlays */
}
</style>
