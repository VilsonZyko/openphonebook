import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Directory',
    component: () => import('./views/DirectoryView.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('./views/AdminPanel.vue')
  },
  {
    path: '/dev',
    name: 'Dev',
    component: () => import('./views/DevPanel.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
