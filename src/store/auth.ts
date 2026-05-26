import { reactive, computed } from 'vue'

export interface UserSession {
  token: string
  userId: string
  name: string
  email: string
}

const state = reactive({
  user: null as UserSession | null,
  isInitialized: false
})

export const authStore = {
  // Getters
  user: computed(() => state.user),
  isAuthenticated: computed(() => !!state.user?.token),
  token: computed(() => state.user?.token || ''),
  userId: computed(() => state.user?.userId || ''),

  // Actions
  login(session: UserSession) {
    state.user = session
    localStorage.setItem('blog_auth_session', JSON.stringify(session))
  },

  logout() {
    state.user = null
    localStorage.removeItem('blog_auth_session')
  },

  initialize() {
    if (state.isInitialized) return
    const stored = localStorage.getItem('blog_auth_session')
    if (stored) {
      try {
        state.user = JSON.parse(stored)
      } catch (e) {
        localStorage.removeItem('blog_auth_session')
      }
    }
    state.isInitialized = true
  }
}
