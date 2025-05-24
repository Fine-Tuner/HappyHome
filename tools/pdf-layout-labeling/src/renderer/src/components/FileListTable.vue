<template>
  <div class="table__wrapper" ref="table"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { TabulatorFull, Tabulator, RowComponent, Column } from 'tabulator-tables'

const props = defineProps<{
  columns: Column[]
  tableData: unknown[]
}>()
const emits = defineEmits(['row-id-change'])

const table = ref<HTMLElement | null>(null)
const tabulator = ref<Tabulator | null>(null)
const rowId = ref<number | null>(null)
const pageIndex = ref(0)
const jumpToInput = ref('')

const rowHeight = 31
const headerFooterHeight = 64 + 51 + 5
const maxNumRowsPerPage = Math.floor((window.innerHeight - headerFooterHeight) / rowHeight)
const pageSize = ref(maxNumRowsPerPage)

const lastPageIndex = computed(() => Math.ceil((props.tableData?.length || 0) / pageSize.value) - 1)

function selectRow(id: number, deselect = true): void {
  if (deselect) {
    tabulator.value?.deselectRow()
  }
  rowId.value = id
  tabulator.value?.selectRow(rowId.value)
}

function goToPrevPage(): void {
  if (pageIndex.value === 0) return
  pageIndex.value--
  tabulator.value?.deselectRow()
  tabulator.value?.previousPage()
}

function goToNextPage(): void {
  if (pageIndex.value === lastPageIndex.value) return
  pageIndex.value++
  tabulator.value?.deselectRow()
  tabulator.value?.nextPage()
}

function keyDownHandler(e: KeyboardEvent): void {
  // j, k 아니면 return
  if (rowId.value === null) return

  const row = tabulator.value?.getRow(rowId.value)
  if (row === undefined) return

  const currPosition = row.getPosition()
  // 화면에 안 보이는 경우 (e.g. 선택 후 필터링)
  if (currPosition === false) return

  if (e.code === 'ArrowDown') {
    let nextPosition: number
    if (currPosition === pageSize.value) {
      if (pageIndex.value === lastPageIndex.value) {
        return
      }
      goToNextPage()
      nextPosition = 1
    } else {
      nextPosition = currPosition + 1
    }
    const nextRow = tabulator.value?.getRowFromPosition(nextPosition)
    if (nextRow) {
      selectRow(nextRow.getIndex())
    }
  } else if (e.code === 'ArrowUp') {
    let prevPosition: number
    if (currPosition === 1) {
      if (pageIndex.value === 0) {
        return
      }
      goToPrevPage()
      prevPosition = pageSize.value
    } else {
      prevPosition = currPosition - 1
    }
    const prevRow = tabulator.value?.getRowFromPosition(prevPosition)
    if (prevRow) {
      selectRow(prevRow.getIndex())
    }
  }
}

function setTableData(data: unknown[]): void {
  tabulator.value?.setData(data)
  pageIndex.value = 0
  tabulator.value?.setPage(1)
  tabulator.value?.deselectRow()
}

function updateTableRow(id: number, data: Record<string, unknown>): void {
  tabulator.value?.updateData([{ id, ...data }])
}

function addJumpToPageElement(): void {
  if (!table.value) return
  const elem = table.value.querySelector('.tabulator-footer-contents')
  if (!elem) return
  const jumpToDiv = document.createElement('div')
  jumpToDiv.id = 'jump-to-page'
  jumpToDiv.style.display = 'inline-block'
  jumpToDiv.style.marginLeft = '10px'
  jumpToDiv.innerHTML = `
    <input type="text" class="jumpTo tabulator-page-size" style="width: 40px; height: 19px; font-size: 14px; font-weight: 400; text-align: center;">
    `
  const input = jumpToDiv.querySelector('.jumpTo') as HTMLInputElement | null
  if (!input) return
  input.style.fontFamily = getComputedStyle(document.body).fontFamily
  input.value = jumpToInput.value
  input.addEventListener('input', (e) => {
    jumpToInput.value = (e.target as HTMLInputElement).value
  })
  elem.appendChild(jumpToDiv)

  const jumpToPage = (): void => {
    const pageNum = parseInt(jumpToInput.value)
    if (pageNum && pageNum > 0 && pageNum <= tabulator.value.getPageMax()) {
      tabulator.value.setPage(pageNum)
    } else {
      alert('Invalid page number')
    }
    jumpToInput.value = ''
  }

  input.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      jumpToPage()
    }
    if ((e as KeyboardEvent).key === 'a') {
      if ((e as KeyboardEvent).ctrlKey || (e as KeyboardEvent).metaKey) {
        e.preventDefault()
        const target = e.target as HTMLInputElement | null
        if (target && typeof target.select === 'function') {
          target.select()
        }
      }
    }
  })
}

onMounted(() => {
  tabulator.value = new TabulatorFull(table.value!, {
    height: '100%',
    reactiveData: true,
    layout: 'fitColumns',
    data: props.tableData,
    pagination: true,
    paginationSize: pageSize.value,
    paginationButtonCount: 3,
    paginationCounter: 'pages',
    columns: props.columns,
    rowHeight: rowHeight
  })
  tabulator.value.on('rowClick', (e, row: RowComponent) => {
    const selectedData = tabulator.value?.getSelectedData()
    const id = row.getIndex()
    selectRow(id, selectedData?.length !== 0)
  })
  tabulator.value.on('tableBuilt', () => {
    addJumpToPageElement()
    // Add page selector
  })
  tabulator.value.on('pageLoaded', (pageno) => {
    pageIndex.value = pageno - 1
  })

  window.addEventListener('keydown', keyDownHandler)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keyDownHandler)
})

watch(rowId, (id) => {
  emits('row-id-change', props.tableData[id!])
})

watch(() => props.tableData, setTableData)

defineExpose({
  rowId,
  updateTableRow
})
</script>

<style scoped>
.table__wrapper {
  user-select: none;
  width: 100%;
  height: 100%;
}
</style>
