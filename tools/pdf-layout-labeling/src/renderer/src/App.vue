<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentRouteName = computed(() => {
  return router.currentRoute.value.name
})

function navigate(name: string): void {
  if (currentRouteName.value !== name) {
    router.push(name)
  }
}

onMounted(async () => {
  window.api.onNavigate((payload: { name: string }) => {
    console.log('navigate', payload)
    navigate(payload.name)
  })
})
</script>

<style scoped lang="scss">
.app-container {
  width: 100%;
  height: 100%;
}
</style>
