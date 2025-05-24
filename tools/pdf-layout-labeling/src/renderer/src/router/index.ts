/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHashHistory } from 'vue-router/auto'

const routes = [
  {
    path: '/block',
    name: 'block',
    component: () => import('@renderer/pages/BlockPage.vue')
  },
  {
    path: '/condition',
    name: 'condition',
    component: () => import('@renderer/pages/ConditionPage.vue')
  }
]

// https://stackoverflow.com/questions/76312920/electron-renders-blank-page-once-i-implemented-vue-router
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
})

export default router
