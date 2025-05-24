<template>
  <div class="container">
    <div class="table-container" :style="{ width: tableWidth + 'px' }">
      <FileListTable
        v-if="tableData.length > 0"
        ref="table"
        :columns="tableColumns"
        :table-data="tableData"
        @row-id-change="loadImage"
      ></FileListTable>
    </div>
    <!-- Resizable divider -->
    <div class="resize-divider" @mousedown="startResize"></div>
    <!-- Move the Open Directory button to be centered in the entire window -->
    <v-btn
      v-if="tableData.length === 0"
      class="load-table-data-btn-centered"
      @click="loadTableData"
      size="large"
    >
      Open Directory
    </v-btn>
    <div ref="imageContainerRef" class="image-container">
      <ConditionLabelingLayer
        v-if="imageDataWithConditions"
        :image="imageDataWithConditions.image"
        :width="imageDataWithConditions.width"
        :height="imageDataWithConditions.height"
        :conditions="imageDataWithConditions.conditions"
        :container-width="containerWidth"
        :container-height="containerHeight"
        @update:condition-bbox="handleConditionBboxUpdate"
        @delete:condition="handleDeleteCondition"
        @update:condition-content="handleConditionContentUpdate"
      />
      <v-btn
        v-if="imageDataWithConditions"
        size="small"
        :color="imageDataWithConditions.completed ? 'grey' : 'success'"
        class="complete-btn"
        @click="
          handleStatusUpdate(
            imageDataWithConditions.announcement_id,
            imageDataWithConditions.page,
            imageDataWithConditions.filename,
            !imageDataWithConditions.completed
          )
        "
      >
        {{ imageDataWithConditions.completed ? 'Mark as Incomplete' : 'Mark as Complete' }}
      </v-btn>
      <v-btn
        size="small"
        v-if="imageDataWithConditions"
        @click="createNewCondition"
        class="add-condition-btn"
        >Add Condition</v-btn
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import ConditionLabelingLayer from '@renderer/components/ConditionLabelingLayer.vue'
import FileListTable from '@renderer/components/FileListTable.vue'
import type { Condition, ImageDataWithConditions, ImageData } from '@/types'
import { ref, onMounted, onUnmounted } from 'vue'
import { parseFilename } from '@/common/utils' // Import shared function

// Define the expected structure for table data, including the new field
interface TableRow {
  id: number // Keep id if needed for Tabulator
  filename: string
  completed: boolean
}

const imageDataWithConditions = ref<ImageDataWithConditions | null>(null)
const table = ref<InstanceType<typeof FileListTable> | null>(null)
const tableData = ref<TableRow[]>([])
const imageContainerRef = ref<HTMLDivElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)
const tableWidth = ref(320) // Default table width
let resizeObserver: ResizeObserver | null = null
let isResizing = false

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
    imageDataWithConditions.value = null
    return
  }
  const { announcement_id, page } = parsed

  const imageData: ImageData | null = await window.api.getImage(row.filename)
  const conditionsData: Condition[] | null = await window.api.getConditions(announcement_id, page)
  if (imageData) {
    const imgObj = new Image()
    imgObj.onload = () => {
      imageDataWithConditions.value = {
        filename: row.filename,
        announcement_id,
        page,
        image: imgObj,
        width: imageData.width,
        height: imageData.height,
        conditions: conditionsData,
        completed: row.completed
      }
    }
    imgObj.onerror = (err) => {
      imageDataWithConditions.value = null
      console.error('Error loading image:', err)
    }
    imgObj.src = `data:image/png;base64,${imageData.data}`
  } else {
    imageDataWithConditions.value = null
  }
}

async function handleConditionBboxUpdate(
  _id: string,
  newBbox: [number, number, number, number]
): Promise<void> {
  const cond = imageDataWithConditions.value?.conditions.find((c) => c._id === _id)
  if (cond) {
    const { announcement_id, page } = cond
    const originalBbox = cond.bbox.map((arr) => [...arr])
    cond.bbox[0] = newBbox // Use first element for main box
    try {
      const result = await window.api.updateCondition(announcement_id, page, _id, {
        bbox: [newBbox]
      })
      if (result?.success) {
        console.log(`Bbox updated for condition ${_id}`)
      } else {
        cond.bbox = originalBbox
        console.error(`Failed to update bbox for condition ${_id}`)
      }
    } catch {
      cond.bbox = originalBbox
      console.error(`Error updating bbox for condition ${_id}`)
    }
  }
}

async function handleDeleteCondition(_id: string): Promise<void> {
  console.log('handleDeleteCondition', _id)
  const conditions = imageDataWithConditions.value?.conditions
  const idx = conditions.findIndex((c) => c._id === _id)
  if (idx !== -1) {
    const cond = conditions[idx]
    const { announcement_id, page } = cond
    const removed = { ...cond }
    conditions.splice(idx, 1)
    try {
      const result = await window.api.deleteCondition(announcement_id, page, _id)
      if (result?.success) {
        console.log(`Condition ${_id} deleted successfully`)
      } else {
        conditions.splice(idx, 0, removed)
        console.error(`Failed to delete condition ${_id}`)
      }
    } catch {
      conditions.splice(idx, 0, removed)
      console.error(`Error deleting condition ${_id}`)
    }
  }
}

async function createNewCondition(): Promise<void> {
  if (!imageDataWithConditions.value) return
  const { announcement_id, page } = imageDataWithConditions.value
  const newCondition: Condition = {
    _id: crypto.randomUUID(),
    announcement_id,
    llm_output_id: '',
    category_id: '',
    content: '',
    section: '',
    page,
    bbox: [[0.1, 0.1, 0.2, 0.2]], // Use array of arrays
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  // Insert to backend first
  const result = await window.api.insertCondition(newCondition)
  if (result.success) {
    imageDataWithConditions.value?.conditions.push(newCondition)
    console.log('Condition created successfully')
  } else {
    console.error('Failed to insert condition:', result.error)
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

      if (imageDataWithConditions.value && imageDataWithConditions.value.filename === filename) {
        imageDataWithConditions.value.completed = newStatus
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

async function handleConditionContentUpdate(_id: string, newContent: string): Promise<void> {
  const condition = imageDataWithConditions.value?.conditions.find((c) => c._id === _id)
  if (condition) {
    const { announcement_id, page } = condition
    const originalContent = condition.content
    condition.content = newContent
    try {
      const result = await window.api.updateCondition(announcement_id, page, _id, {
        content: newContent
      })
      if (result?.success) {
        console.log(`Content updated for condition ${_id}`)
      } else {
        condition.content = originalContent
        console.error(`Failed to update content for condition ${_id}`)
        alert(`Failed to update content for condition ${_id}`)
      }
    } catch {
      condition.content = originalContent
      console.error(`Error updating content for condition ${_id}`)
      alert(`Error updating content for condition ${_id}`)
    }
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
    return
  }

  if (imageDataWithConditions.value && event.key.toLowerCase() === 'd') {
    console.log('"d" key pressed, toggling completion status.')
    handleStatusUpdate(
      imageDataWithConditions.value.announcement_id,
      imageDataWithConditions.value.page,
      imageDataWithConditions.value.filename,
      !imageDataWithConditions.value.completed
    )
  }
}

function startResize(event: MouseEvent): void {
  isResizing = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none' // Prevent text selection during resize
  event.preventDefault()
}

function handleResize(event: MouseEvent): void {
  if (!isResizing) return

  const containerElement = document.querySelector('.container') as HTMLElement
  if (!containerElement) return

  const containerRect = containerElement.getBoundingClientRect()
  const newWidth = event.clientX - containerRect.left

  // Set minimum and maximum widths
  const minWidth = 200
  // Ensure image container has at least 620px (300px image + 320px annotation panel)
  const maxWidth = containerRect.width - 620 - 4 // Subtract divider width

  if (newWidth >= minWidth && newWidth <= maxWidth) {
    tableWidth.value = newWidth
  }
}

function stopResize(): void {
  isResizing = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
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
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: row;
  position: relative; /* Add relative positioning for absolute children */
}
.table-container {
  /* Remove fixed width since it's now dynamic */
  min-width: 200px; /* Minimum width constraint */
  max-width: calc(100vw - 300px); /* Maximum width constraint */
  height: 100vh;
  background: #fafbfc;
  position: relative;
  overflow: hidden;
  /* Remove flexbox centering since button is now at container level */
}
.resize-divider {
  width: 4px;
  background-color: #ddd;
  cursor: col-resize;
  height: 100vh;
  position: relative;
  flex-shrink: 0; /* Prevent the divider from shrinking */
  transition: background-color 0.2s ease;
}
.resize-divider:hover {
  background-color: #1976d2; /* Blue color on hover for better visibility */
}
.image-container {
  flex: 1; /* Take up remaining space */
  height: 100vh;
  position: relative;
  min-width: 620px; /* Minimum width to accommodate 300px image + 320px annotation panel */
  background: #f8f8f8;
  display: flex;
  flex-direction: column;
}
.load-table-data-btn-centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 30; /* Ensure button appears above other content */
}
.add-condition-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
}
.complete-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
}
</style>
