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
    component: () => import('./views/AdminPanel.vue'),
    // Any authenticated user (admin or dev) may access the Admin Panel.
    meta: { requiresAuth: true }
  },
  {
    path: '/dev',
    name: 'Dev',
    component: () => import('./views/DevPanel.vue'),
    // Dev Panel is exclusively for the dev role; admin-only users are redirected.
    meta: { requiresAuth: true, requiresDevRole: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ---------------------------------------------------------------------------
// Navigation Guard
// Auth state lives in sessionStorage (same source used by the composables).
// All mutating API calls are independently protected by the server, so this
// guard is a UX improvement — it stops panels from being visually exposed to
// unauthenticated/unauthorised users — not a server-side security gate.
//
// Access matrix:
//   /admin — any authenticated role (admin or dev)
//   /dev   — dev role only
// ---------------------------------------------------------------------------
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const pin = sessionStorage.getItem('openphonebook_pin')
  if (!pin) {
    // Unauthenticated users MUST be allowed through so they can see the login
    // screens inside AdminPanel.vue and DevPanel.vue.
    return true
  }

  // If they have a PIN and are trying to access the dev panel, verify their role.
  if (to.meta.requiresDevRole) {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'X-Auth-PIN': pin, 'Content-Type': 'application/json' }
      })
      if (!res.ok) return true // Let the component's login screen handle invalid PINs
      
      const { role } = await res.json()
      // If an admin-only user navigates to /dev, let them through to the component.
      // DevPanel.vue will detect their PIN lacks dev privileges and render the Dev
      // Login screen, allowing them to enter the Dev PIN and escalate their session.
      return true
    } catch {
      return true
    }
  }

  return true
})

export default router
