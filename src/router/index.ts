import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { authStore } from '@/store/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/blog/:id',
    name: 'BlogDetail',
    component: () => import('@/views/BlogDetailView.vue')
  },
  {
    path: '/editor',
    name: 'CreateBlog',
    component: () => import('@/views/EditorView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/editor/:id',
    name: 'EditBlog',
    component: () => import('@/views/EditorView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthView.vue')
  },
  {
    path: '/profile/:id',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Navigation Guard
router.beforeEach((to, _from, next) => {
  // Ensure session store is loaded
  authStore.initialize()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated.value) {
    next({ name: 'Auth', query: { redirect: to.fullPath } })
  } else if (to.name === 'Auth' && authStore.isAuthenticated.value) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
