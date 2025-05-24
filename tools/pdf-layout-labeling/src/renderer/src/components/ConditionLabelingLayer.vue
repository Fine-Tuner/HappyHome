<template>
  <div class="labeling-container">
    <!-- Main Image Area -->
    <div class="image-area">
      <v-stage :config="{ width: imageAreaWidth, height: imageAreaHeight }">
        <v-layer ref="layer"> </v-layer>
      </v-stage>
    </div>
    <!-- Right Panel for Annotations -->
    <div class="right-panel">
      <div class="panel-title">Annotations</div>
      <div
        v-for="condition in props.conditions"
        :key="condition._id"
        :class="['annotation-item', { selected: selectedConditionId === condition._id }]"
        @click="selectCondition(condition._id)"
        :ref="(el) => annotationItemRefs.value && (annotationItemRefs.value[condition._id] = el)"
      >
        <textarea
          class="annotation-textarea"
          :value="condition.content"
          :rows="selectedConditionId === condition._id ? 4 : 1"
          placeholder="Enter annotation text..."
          @input="
            (e) =>
              emit(
                'update:condition-content',
                condition._id,
                (e.target as HTMLTextAreaElement).value
              )
          "
          @focus="selectCondition(condition._id)"
          @click.stop
        ></textarea>
        <v-btn
          icon
          size="small"
          variant="text"
          @click.stop="onDeleteCondition(condition._id)"
          class="delete-icon-button"
          title="Delete annotation"
        >
          <v-icon color="red-darken-1">mdi-delete</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Konva from 'konva'
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import { Condition } from '@/types'

const props = defineProps({
  image: HTMLImageElement,
  width: Number,
  height: Number,
  conditions: Array as () => Condition[],
  containerWidth: Number,
  containerHeight: Number
})

const layer = ref<Konva.Layer | null>(null)
const selectedConditionId = ref<string | null>(null)
const annotationItemRefs = ref<Record<string, HTMLDivElement | null>>({})

const scale = computed(() => {
  if (!props.width || !props.height || !props.containerWidth || !props.containerHeight) {
    return 1
  }

  // Calculate available space for image (subtract annotation panel width)
  const annotationPanelWidth = 320
  const availableWidth = props.containerWidth - annotationPanelWidth
  const availableHeight = props.containerHeight

  // Calculate scale to fit the image completely in available space
  const scaleX = availableWidth / props.width
  const scaleY = availableHeight / props.height

  // Use the smaller scale to ensure image fits completely without cropping
  return Math.min(scaleX, scaleY)
})

const scaledWidth = computed(() => {
  return (props.width || 0) * scale.value
})

const scaledHeight = computed(() => {
  return (props.height || 0) * scale.value
})

// Calculate the available space for the image area
const imageAreaWidth = computed(() => {
  const annotationPanelWidth = 320
  return (props.containerWidth || 0) - annotationPanelWidth
})

const imageAreaHeight = computed(() => {
  return props.containerHeight || 0
})

// Calculate offset to center the image in the available space
const imageOffsetX = computed(() => {
  return Math.max(0, (imageAreaWidth.value - scaledWidth.value) / 2)
})

const imageOffsetY = computed(() => {
  return Math.max(0, (imageAreaHeight.value - scaledHeight.value) / 2)
})

function redrawLayer(): void {
  setImage()
}

function drawSelectedBlock(): void {
  if (!layer.value || !props.conditions || !props.width || !props.height || scale.value === 0) {
    return
  }
  const konvaLayer = layer.value.getNode()
  konvaLayer.find('Rect').forEach((rect) => rect.destroy())
  konvaLayer.find('Text').forEach((text) => text.destroy())
  konvaLayer.find('Transformer').forEach((tr) => tr.destroy())

  if (!selectedConditionId.value) return
  const condition = (props.conditions as Condition[]).find(
    (c) => c._id === selectedConditionId.value
  )
  if (!condition) return

  const [nx1, ny1, nx2, ny2] = condition.bbox[0]
  const imgWidth = props.width as number
  const imgHeight = props.height as number

  const x1 = nx1 * imgWidth
  const y1 = ny1 * imgHeight
  const x2 = nx2 * imgWidth
  const y2 = ny2 * imgHeight

  // Apply scaling and add image offset for proper positioning
  const scaledX1 = x1 * scale.value + imageOffsetX.value
  const scaledY1 = y1 * scale.value + imageOffsetY.value
  const scaledWidthRect = (x2 - x1) * scale.value
  const scaledHeightRect = (y2 - y1) * scale.value

  const rect = new Konva.Rect({
    x: scaledX1,
    y: scaledY1,
    width: scaledWidthRect,
    height: scaledHeightRect,
    draggable: true
  })
  rect.setAttr('_id', condition._id)
  konvaLayer.add(rect)

  const tr = new Konva.Transformer({
    nodes: [rect],
    rotateEnabled: false,
    anchorSize: 6
  })
  konvaLayer.add(tr)

  rect.on('dragend', handleDragEnd)
  tr.on('transformend', handleTransformEnd)

  // Add text overlay inside the bbox
  const text = new Konva.Text({
    x: scaledX1,
    y: scaledY1 - 20,
    text: condition.content || '',
    fontSize: 14,
    fill: '#333',
    width: scaledWidthRect,
    align: 'left',
    padding: 2
  })
  konvaLayer.add(text)

  konvaLayer.batchDraw()
}

function setImage(): void {
  if (!layer.value || !props.image) {
    return
  }
  if (scaledWidth.value <= 0 || scaledHeight.value <= 0) {
    return
  }
  const konvaLayer = layer.value.getNode()
  konvaLayer.destroyChildren()
  const konvaImage = new Konva.Image({
    x: imageOffsetX.value,
    y: imageOffsetY.value,
    width: scaledWidth.value,
    height: scaledHeight.value,
    image: props.image
  })
  konvaLayer.add(konvaImage)
  try {
    const ctx = konvaLayer.getContext()._context
    ctx.imageSmoothingEnabled = false
  } catch {
    /* ignore if context is not available for image smoothing */
  }
  drawSelectedBlock()
  konvaLayer.batchDraw()
}

function calculateAndUpdateBbox(node: Konva.Rect): void {
  if (!props.width || !props.height || scale.value === 0) {
    return
  }
  const blockId = node.getAttr('_id') as string
  if (!blockId) {
    return
  }
  // Get screen coordinates and subtract image offset
  const scaledX1 = node.x() - imageOffsetX.value
  const scaledY1 = node.y() - imageOffsetY.value
  const scaledWidthRect = node.width() * node.scaleX()
  const scaledHeightRect = node.height() * node.scaleY()
  const scaledX2 = scaledX1 + scaledWidthRect
  const scaledY2 = scaledY1 + scaledHeightRect

  // Convert back to original image coordinates
  const originalX1 = scaledX1 / scale.value
  const originalY1 = scaledY1 / scale.value
  const originalX2 = scaledX2 / scale.value
  const originalY2 = scaledY2 / scale.value

  // Normalize to 0-1 range
  const nx1 = originalX1 / props.width
  const ny1 = originalY1 / props.height
  const nx2 = originalX2 / props.width
  const ny2 = originalY2 / props.height
  const newBbox: [number, number, number, number] = [nx1, ny1, nx2, ny2]
  emit('update:condition-bbox', blockId, newBbox)
  node.scaleX(1)
  node.scaleY(1)
  node.width(scaledWidthRect)
  node.height(scaledHeightRect)
}

function handleDragEnd(e: Konva.KonvaEventObject<DragEvent>): void {
  const node = e.target as Konva.Rect
  calculateAndUpdateBbox(node)
}

function handleTransformEnd(e: Konva.KonvaEventObject<Event>): void {
  const node = e.target as Konva.Rect
  if (!node || node.getClassName() !== 'Rect') {
    const tr = e.target as Konva.Transformer
    const attachedNode = tr.nodes()[0] as Konva.Rect
    if (attachedNode) {
      calculateAndUpdateBbox(attachedNode)
    }
  } else {
    calculateAndUpdateBbox(node)
  }
}

function onDeleteCondition(_id: string): void {
  emit('delete:condition', _id)
  if (selectedConditionId.value === _id) {
    selectedConditionId.value = null
  }
}

function selectCondition(_id: string): void {
  selectedConditionId.value = _id
  setImage()
  nextTick(() => {
    const itemEl = annotationItemRefs.value[_id]
    if (itemEl) {
      itemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      // Attempt to focus the textarea to help with auto-grow and user experience
      const textareaWrapper = itemEl.querySelector('.annotation-textarea')
      if (textareaWrapper) {
        const actualTextarea = textareaWrapper.querySelector('textarea')
        if (actualTextarea) {
          actualTextarea.focus()
        }
      }
    }
  })
}

const emit = defineEmits(['update:condition-bbox', 'update:condition-content', 'delete:condition'])

onMounted(() => {
  redrawLayer()
})

watch(
  [() => props.image, scale],
  () => {
    redrawLayer()
  },
  { immediate: false }
)

watch(
  () => props.conditions,
  () => {
    if (layer.value) {
      setImage()
    }
  },
  { deep: true, immediate: false }
)

// Watch for container size changes and update image accordingly
watch(
  [() => props.containerWidth, () => props.containerHeight],
  () => {
    if (layer.value && props.image) {
      // Redraw everything when container size changes
      setImage()
    }
  },
  { immediate: false }
)
</script>

<style scoped>
.labeling-container {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  min-width: 620px; /* Minimum width to ensure both panels are usable */
}
.image-area {
  flex: 1;
  position: relative;
  background: #f8f8f8;
  min-width: 300px; /* Ensure minimum space for image */
  height: 100%;
  overflow: hidden; /* Prevent overflow */
}
.right-panel {
  width: 320px;
  min-width: 320px; /* Ensure panel never shrinks */
  flex-shrink: 0; /* Prevent shrinking */
  background: #f4f4f4;
  padding: 20px 16px; /* Increased padding for better spacing */
  overflow-y: auto;
  height: 100%;
  box-sizing: border-box;
}
.panel-title {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 16px; /* Increased margin below title */
  color: #444;
}
.annotation-item {
  display: flex;
  align-items: flex-start; /* Change to flex-start for better alignment when textarea expands */
  justify-content: space-between; /* Ensure proper spacing between textarea and button */
  margin-bottom: 8px;
  padding: 8px 12px; /* More padding for better visual spacing */
  border-radius: 6px; /* Slightly more rounded corners */
  cursor: pointer;
  background: #fff;
  border: 1px solid #e0e0e0; /* Softer default border */
  transition:
    border-color 0.2s ease-in-out,
    background-color 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out,
    min-height 0.2s ease-in-out; /* Added transition for height changes */
  width: 100%;
  min-height: 40px; /* Ensure minimum height for better button visibility */
  box-sizing: border-box;
}

.annotation-item:hover {
  border-color: #1976d2; /* Highlight with theme color on hover */
  background: #f5f5f5; /* Slight background change */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow on hover */
}

.annotation-item.selected {
  border: 2px solid #1976d2; /* Thicker border for better selection visibility */
  background: #e3f0ff;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2); /* Blue shadow for selected state */
  min-height: auto; /* Allow natural height expansion for selected items */
}

.annotation-textarea {
  flex: 1; /* Take up available space but allow button to be visible */
  margin-right: 8px; /* Ensure spacing from delete button */
  padding: 8px 12px; /* Internal padding for text */
  border: 1px solid #e0e0e0; /* Default border */
  border-radius: 4px; /* Rounded corners */
  font-family: inherit; /* Use same font as parent */
  font-size: 14px; /* Readable font size */
  line-height: 1.4; /* Good line spacing */
  resize: none; /* Prevent manual resizing */
  background-color: #ffffff; /* White background */
  transition: all 0.3s ease-in-out; /* Smooth transition for expansion */
  outline: none; /* Remove default outline */
  min-height: 20px; /* Minimum height */
}

.annotation-textarea:focus {
  border-color: #1976d2; /* Blue border when focused */
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1); /* Subtle focus glow */
}

/* Better styling for expanded textarea */
.annotation-item.selected .annotation-textarea {
  border-color: #1976d2; /* Blue border for selected items */
  background-color: #ffffff !important;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1); /* Subtle glow for selected */
}

.delete-icon-button {
  flex-shrink: 0; /* Prevent button from shrinking */
  min-width: 32px !important; /* Ensure minimum button width with !important */
  min-height: 32px !important; /* Ensure minimum button height with !important */
  width: 32px !important; /* Fixed width for consistency */
  height: 32px !important; /* Fixed height for consistency */
  margin-left: 4px; /* Small margin from textarea */
  margin-top: 2px; /* Small top margin for better alignment */
  background-color: rgba(244, 67, 54, 0.1) !important; /* Light red background always visible */
  border: 1px solid rgba(244, 67, 54, 0.3) !important; /* Light red border */
  border-radius: 4px !important;
  transition: all 0.2s ease-in-out !important; /* Smooth transitions for all properties */
}

.delete-icon-button:hover {
  background-color: rgba(244, 67, 54, 0.2) !important; /* Darker red background on hover */
  border-color: rgba(244, 67, 54, 0.5) !important; /* Darker border on hover */
  transform: scale(1.05) !important; /* Slight scale effect on hover */
}

/* Ensure delete button is prominent when annotation item is selected */
.annotation-item.selected .delete-icon-button {
  background-color: rgba(244, 67, 54, 0.15) !important;
  border-color: rgba(244, 67, 54, 0.4) !important;
}
</style>
