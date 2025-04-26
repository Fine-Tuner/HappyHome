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
      <KonvaLayer
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
      <v-btn size="small" v-if="imageDataWithBlocks" @click="createNewBlock" class="add-block-btn"
        >Add Block</v-btn
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import KonvaLayer from './KonvaLayer.vue'
import FileListTable from './FileListTable.vue'
import type { ImageDataWithBlocks, Block } from '@/types'
import { BlockType } from '@/types'
import { ref, onMounted, onUnmounted } from 'vue'

interface TableRow {
  filename: string
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
  }
]

async function loadTableData(): Promise<void> {
  const data = await window.api.getTableData()
  tableData.value = data
}

async function loadImage(row: TableRow): Promise<void> {
  const result = (await window.api.getImageData(row.filename)) as ImageDataWithBlocks
  if (result) {
    const img = new Image()
    img.onload = () => {
      imageDataWithBlocks.value = {
        filename: row.filename,
        image: img,
        width: result.width,
        height: result.height,
        blocks: result.blocks
      }
    }
    img.onerror = (err) => {
      console.error('Error loading image:', err)
      imageDataWithBlocks.value = null
    }
    img.src = `data:image/png;base64,${result.data}`
  } else {
    imageDataWithBlocks.value = null
  }
}

async function handleBlockTypeUpdate(uid: string, newType: BlockType): Promise<void> {
  if (!imageDataWithBlocks.value || !imageDataWithBlocks.value.blocks) return

  const block = imageDataWithBlocks.value.blocks.find((b) => b.uid === uid)
  if (block) {
    const originalType = block.type
    block.type = newType
    try {
      const success = await window.api.updateBlock(imageDataWithBlocks.value.filename, uid, {
        type: newType
      })
      if (success) {
        console.log(`Updated type for block ${uid} to ${newType}`)
      } else {
        console.error(`Failed to update block type for ${uid} on backend.`)
        block.type = originalType
      }
    } catch (error) {
      console.error(`Error calling updateBlock for type update on ${uid}:`, error)
      block.type = originalType
    }
  } else {
    console.warn(`Block with uid ${uid} not found for type update.`)
  }
}

async function handleBlockBboxUpdate(
  uid: string,
  newBbox: [number, number, number, number]
): Promise<void> {
  if (!imageDataWithBlocks.value || !imageDataWithBlocks.value.blocks) return

  const block = imageDataWithBlocks.value.blocks.find((b) => b.uid === uid)
  if (block) {
    const originalBbox = [...block.bbox]
    block.bbox = newBbox
    try {
      const success = await window.api.updateBlock(imageDataWithBlocks.value.filename, uid, {
        bbox: newBbox
      })
      if (success) {
        console.log(`Updated bbox for block ${uid}`)
      } else {
        console.error(`Failed to update block bbox for ${uid} on backend.`)
        block.bbox = originalBbox as [number, number, number, number]
      }
    } catch (error) {
      console.error(`Error calling updateBlock for bbox update on ${uid}:`, error)
      block.bbox = originalBbox as [number, number, number, number]
    }
  } else {
    console.warn(`Block with uid ${uid} not found for bbox update.`)
  }
}

async function handleDeleteBlock(uid: string): Promise<void> {
  if (!imageDataWithBlocks.value || !imageDataWithBlocks.value.blocks) return

  const blockIndex = imageDataWithBlocks.value.blocks.findIndex((b) => b.uid === uid)
  if (blockIndex !== -1) {
    const blockToRemove = imageDataWithBlocks.value.blocks[blockIndex]
    imageDataWithBlocks.value.blocks.splice(blockIndex, 1)
    try {
      const success = await window.api.deleteBlock(imageDataWithBlocks.value.filename, uid)
      if (success) {
        console.log(`Deleted block ${uid}`)
      } else {
        console.error(`Failed to delete block ${uid} on backend.`)
        imageDataWithBlocks.value.blocks.splice(blockIndex, 0, blockToRemove)
      }
    } catch (error) {
      console.error(`Error calling deleteBlock for ${uid}:`, error)
      imageDataWithBlocks.value.blocks.splice(blockIndex, 0, blockToRemove)
    }
  } else {
    console.warn(`Block with uid ${uid} not found for deletion.`)
  }
}

async function createNewBlock(): Promise<void> {
  if (!imageDataWithBlocks.value) {
    console.error('Cannot add block: No image data loaded.')
    return
  }

  // Generate a new block with default values
  const newBlock: Block = {
    uid: crypto.randomUUID(), // Generate a unique ID
    bbox: [0.1, 0.1, 0.2, 0.2], // Default position/size (normalized)
    type: BlockType.PLAIN_TEXT, // Default type
    text: '' // Assuming text might be relevant later, initialize empty
  }

  try {
    const result = await window.api.insertBlock(imageDataWithBlocks.value.filename, newBlock)
    if (result.success) {
      // Add the block to the local state to trigger reactivity
      imageDataWithBlocks.value.blocks.push(newBlock)
      console.log(`Successfully added block ${newBlock.uid}`)
    } else {
      console.error(`Failed to add block ${newBlock.uid} on backend:`, result.error)
      // Optionally: Show user feedback
    }
  } catch (error) {
    console.error(`Error calling insertBlock for new block ${newBlock.uid}:`, error)
    // Optionally: Show user feedback
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
})

onUnmounted(() => {
  if (resizeObserver && imageContainerRef.value) {
    resizeObserver.unobserve(imageContainerRef.value)
  }
  resizeObserver = null
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
</style>
