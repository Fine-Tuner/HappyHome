<template>
  <div style="position: relative; width: 100%; height: 100%">
    <v-stage :config="{ width: scaledWidth, height: scaledHeight }">
      <v-layer ref="layer"> </v-layer>
    </v-stage>
    <!-- Container for HTML Select Overlays -->
    <div class="select-overlays">
      <div
        v-for="selectData in selectElementsData"
        :key="selectData._id"
        :style="{
          ...selectData.style,
          display:
            !enableHoverEffect || activeBlockId === null || activeBlockId === selectData._id
              ? 'flex'
              : 'none'
        }"
        class="overlay-item"
      >
        <select
          :value="selectData.type"
          class="block-type-select"
          @change="onUpdateBlockType(selectData._id, $event)"
        >
          <option v-for="option in blockTypeOptions" :key="option.value" :value="option.value">
            {{ option.text }}
          </option>
        </select>
        <button class="delete-button" @click="onDeleteBlock(selectData._id)">X</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Konva from 'konva'
import { ref, watch, onMounted, computed, onUnmounted } from 'vue'
import type { Block } from '@/types'
import { BlockType } from '@/types'

const selectElementsData = ref<{ _id: string; type: BlockType; style: Record<string, string> }[]>(
  []
)

const blockTypeOptions = Object.keys(BlockType)
  .filter((k) => isNaN(Number(k)))
  .map((key) => ({
    value: BlockType[key as keyof typeof BlockType],
    text: key
  }))

const props = defineProps({
  image: HTMLImageElement,
  width: Number,
  height: Number,
  blocks: Array<Block>,
  containerWidth: Number,
  containerHeight: Number
})

const layer = ref(null)
const activeBlockId = ref<string | null>(null)
const enableHoverEffect = ref(true)

const scale = computed(() => {
  if (!props.width || !props.height || !props.containerWidth || !props.containerHeight) {
    return 1
  }
  const scaleX = props.containerWidth / props.width
  const scaleY = props.containerHeight / props.height
  return Math.min(scaleX, scaleY)
})

const scaledWidth = computed(() => {
  return (props.width || 0) * scale.value
})

const scaledHeight = computed(() => {
  return (props.height || 0) * scale.value
})

function redrawLayer(): void {
  setImage()
}

function drawBlocks(): void {
  if (
    !layer.value ||
    typeof layer.value.getNode !== 'function' ||
    !props.blocks ||
    !props.width ||
    !props.height ||
    scale.value === 0
  ) {
    console.warn(
      'Layer ref, getNode method, blocks prop, original dimensions, or valid scale not available yet.'
    )
    return
  }

  const konvaLayer = layer.value.getNode()

  konvaLayer.find('Rect').forEach((rect) => rect.destroy())
  konvaLayer.find('Text').forEach((text) => text.destroy())
  konvaLayer.find('Transformer').forEach((tr) => tr.destroy())

  selectElementsData.value = []

  props.blocks.forEach((block) => {
    const [nx1, ny1, nx2, ny2] = block.bbox
    const imgWidth = props.width as number
    const imgHeight = props.height as number

    const x1 = nx1 * imgWidth
    const y1 = ny1 * imgHeight
    const x2 = nx2 * imgWidth
    const y2 = ny2 * imgHeight

    const scaledX1 = x1 * scale.value
    const scaledY1 = y1 * scale.value
    const scaledWidthRect = (x2 - x1) * scale.value
    const scaledHeightRect = (y2 - y1) * scale.value

    const rect = new Konva.Rect({
      x: scaledX1,
      y: scaledY1,
      width: scaledWidthRect,
      height: scaledHeightRect,
      draggable: true
    })
    rect.setAttr('_id', block._id)
    konvaLayer.add(rect)

    const tr = new Konva.Transformer({
      nodes: [rect],
      rotateEnabled: false,
      anchorSize: 6
    })
    konvaLayer.add(tr)

    // --- Event Listeners (Conditional Hover Effect) ---
    const setIdActive = (): void => {
      activeBlockId.value = block._id
    }

    rect.on('mouseover', setIdActive)
    rect.on('dragstart', setIdActive)

    tr.on('mouseover', setIdActive)
    tr.on('transformstart', setIdActive)
    // --- End Event Listeners ---

    rect.on('dragend', handleDragEnd)
    rect.on('dragmove', handleDragMove)
    tr.on('transformend', handleTransformEnd)
    tr.on('transform', handleTransform)

    const selectStyle = calculateSelectPositionStyle(rect)

    selectElementsData.value.push({
      _id: block._id,
      type: block.type,
      style: selectStyle
    })
  })

  konvaLayer.batchDraw()
}

function setImage(): void {
  if (!layer.value || typeof layer.value.getNode !== 'function' || !props.image) {
    console.warn('Layer ref, getNode method, or image prop missing.')
    return
  }
  if (scaledWidth.value <= 0 || scaledHeight.value <= 0) {
    console.warn('Scaled dimensions are invalid, skipping image draw.')
    return
  }

  const konvaLayer = layer.value.getNode()
  konvaLayer.destroyChildren()

  const konvaImage = new Konva.Image({
    width: scaledWidth.value,
    height: scaledHeight.value,
    image: props.image
  })

  konvaLayer.add(konvaImage)
  try {
    const ctx = konvaLayer.getContext()._context
    ctx.imageSmoothingEnabled = false
  } catch (e) {
    console.error('Could not get context for image smoothing:', e)
  }

  drawBlocks()

  konvaLayer.batchDraw()
}

function calculateAndUpdateBbox(node: Konva.Rect): void {
  if (!props.width || !props.height || scale.value === 0) {
    console.warn('Cannot calculate bbox: Invalid dimensions or scale.')
    return
  }

  const blockId = node.getAttr('_id') as string
  if (!blockId) {
    console.warn('Cannot update bbox: Block ID not found on Konva node.')
    return
  }

  // Get scaled position and dimensions, accounting for transformer scale
  const scaledX1 = node.x()
  const scaledY1 = node.y()
  // Transformer applies scale, rect's width/height don't change, but scaleX/scaleY do
  const scaledWidthRect = node.width() * node.scaleX()
  const scaledHeightRect = node.height() * node.scaleY()
  const scaledX2 = scaledX1 + scaledWidthRect
  const scaledY2 = scaledY1 + scaledHeightRect

  // Convert back to original image coordinates
  const originalX1 = scaledX1 / scale.value
  const originalY1 = scaledY1 / scale.value
  const originalX2 = scaledX2 / scale.value
  const originalY2 = scaledY2 / scale.value

  // Normalize coordinates
  const nx1 = originalX1 / props.width
  const ny1 = originalY1 / props.height
  const nx2 = originalX2 / props.width
  const ny2 = originalY2 / props.height

  const newBbox: [number, number, number, number] = [nx1, ny1, nx2, ny2]

  // Emit the update event
  emit('update:blockBbox', blockId, newBbox)

  // After transform, reset node scale and apply scale to width/height directly
  // This prevents scale compounding on repeated transforms
  node.scaleX(1)
  node.scaleY(1)
  node.width(scaledWidthRect)
  node.height(scaledHeightRect)

  // Final position update
  updateSelectPosition(node)
}

function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>): void {
  const node = e.target as Konva.Rect
  calculateAndUpdateBbox(node)
}

function handleDragMove(e: Konva.KonvaEventObject<DragEvent>): void {
  const node = e.target as Konva.Rect
  updateSelectPosition(node)
}

function handleTransformEnd(e: Konva.KonvaEventObject<Event>): void {
  // The transformer is the target, but we need the Rect node
  const node = e.target as Konva.Rect // Konva types might be incorrect here, often it's the Transformer
  if (!node || node.getClassName() !== 'Rect') {
    // If the target isn't the Rect (it's likely the Transformer), get the node from the transformer
    const tr = e.target as Konva.Transformer
    const attachedNode = tr.nodes()[0] as Konva.Rect // Assuming only one node attached
    if (attachedNode) {
      calculateAndUpdateBbox(attachedNode)
      updateSelectPosition(attachedNode)
    }
  } else {
    // If by chance the Rect itself was the target
    calculateAndUpdateBbox(node)
    updateSelectPosition(node)
  }
}

function handleTransform(e: Konva.KonvaEventObject<Event>): void {
  const rect = e.target as Konva.Rect
  if (rect) {
    updateSelectPosition(rect)
  }
}

function onUpdateBlockType(_id: string, event: Event): void {
  const target = event.target as HTMLSelectElement
  const newType = parseInt(target.value, 10) as BlockType
  emit('update:blockType', _id, newType)
}

function onDeleteBlock(_id: string): void {
  emit('delete:block', _id)
}

const handleKeyDown = (event: KeyboardEvent): void => {
  if (event.key.toLowerCase() === 'g') {
    enableHoverEffect.value = !enableHoverEffect.value
    if (!enableHoverEffect.value) {
      activeBlockId.value = null
    }
  }
}

onMounted(() => {
  redrawLayer()
  window.addEventListener('keydown', handleKeyDown)
})

watch(
  // Watch only image and scale for full redraw triggers
  [() => props.image, scale],
  () => {
    console.log('Watch triggered: Image or scale changed, redrawing layer.')
    redrawLayer() // This handles new page/image loads
  },
  { immediate: false } // Don't run immediately, onMounted handles initial draw
)

// Add watcher for blocks prop changes
watch(
  () => props.blocks,
  () => {
    console.log('Watch triggered: props.blocks changed, redrawing blocks.')
    // Check if layer is ready before drawing
    if (layer.value && typeof layer.value.getNode === 'function') {
      drawBlocks() // Redraw blocks based on the new prop data
    } else {
      console.warn('Blocks watcher triggered, but layer is not ready.')
    }
  },
  { deep: true, immediate: false } // Deep watch necessary for array content changes
)

const emit = defineEmits(['update:blockType', 'update:blockBbox', 'delete:block'])

// Helper function to calculate the style for the select overlay
function calculateSelectPositionStyle(node: Konva.Rect): Record<string, string> {
  const newLeft = node.x() // Position at the left edge
  const newTop = node.y() - 20 // Offset above the rectangle
  return {
    position: 'absolute',
    // Adjust left position slightly to align the *right* side of the controls near the rect corner
    left: `${newLeft}px`, // Align left edge of controls with left edge of rect
    top: `${newTop}px`,
    pointerEvents: 'auto' // Ensure children are interactive
  }
}

// Helper function to update the position of a specific select overlay
function updateSelectPosition(node: Konva.Rect): void {
  const blockId = node.getAttr('_id') as string
  if (!blockId) return

  const selectData = selectElementsData.value.find((data) => data._id === blockId)
  if (selectData) {
    selectData.style = calculateSelectPositionStyle(node)
  }
}

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.select-overlays {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.overlay-item {
  position: absolute; /* Needed for correct positioning of select and button */
  display: flex; /* Align select and button */
  align-items: center;
  pointer-events: none; /* Let events pass through to Konva unless over children */
}

.block-type-select {
  /* position: absolute; Removed absolute positioning from here */
  pointer-events: auto;
  padding: 1px;
  font-size: 12px;
  border: 1px solid #ccc;
  background-color: white;
  max-width: 150px;
  z-index: 10;
}

.delete-button {
  pointer-events: auto;
  margin-left: 4px; /* Space between select and button */
  padding: 1px 4px;
  font-size: 10px;
  line-height: 1;
  color: red;
  background-color: white;
  border: 1px solid red;
  cursor: pointer;
  z-index: 10;
}
</style>
