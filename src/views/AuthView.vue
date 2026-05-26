<template>
  <div class="auth-wrapper animate-fade-in">
    <div class="auth-card glass">
      <div class="auth-tabs">
        <button 
          @click="activeTab = 'login'" 
          :class="['tab-btn', { active: activeTab === 'login' }]"
        >
          Sign In
        </button>
        <button 
          @click="activeTab = 'signup'" 
          :class="['tab-btn', { active: activeTab === 'signup' }]"
        >
          Register
        </button>
      </div>

      <div class="auth-body">
        <h2 class="auth-title">
          {{ activeTab === 'login' ? 'Welcome Back' : 'Create Account' }}
        </h2>
        <p class="auth-subtitle">
          {{ activeTab === 'login' ? 'Sign in to access your dashboard and publish blogs' : 'Join a cosmic space of articles, ideas, and AI features' }}
        </p>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div v-if="error" class="error-banner">
            <span>⚠️ {{ error }}</span>
          </div>

          <div v-if="activeTab === 'signup'" class="form-group">
            <label class="form-label" for="name">Your Name</label>
            <input 
              type="text" 
              id="name" 
              v-model="form.name" 
              class="form-input" 
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              v-model="form.email" 
              class="form-input" 
              placeholder="name@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="form.password" 
              class="form-input" 
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" :disabled="loading" class="btn btn-primary w-full submit-btn">
            <span v-if="loading" class="spinner btn-spinner"></span>
            <span v-else>{{ activeTab === 'login' ? 'Sign In' : 'Register' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/services/api'
import { authStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()

const activeTab = ref<'login' | 'signup'>('login')
const loading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  email: '',
  password: ''
})

// Clear errors when switching tabs
watch(activeTab, () => {
  error.value = ''
  form.name = ''
  form.email = ''
  form.password = ''
})

const handleSubmit = async () => {
  error.value = ''
  loading.value = ref(true).value // simple reactives
  
  try {
    if (activeTab.value === 'login') {
      const response = await api.auth.login(form.email, form.password)
      authStore.login(response)
    } else {
      const response = await api.auth.signup(form.name, form.email, form.password)
      authStore.login(response)
    }
    
    // Redirect back or to dashboard
    const redirectPath = (route.query.redirect as string) || '/dashboard'
    router.push(redirectPath)
  } catch (err: any) {
    error.value = err.message || 'Authentication failed. Please check your credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  padding: 40px 0;
}

.auth-card {
  width: 100%;
  max-width: 480px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
}

.auth-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid var(--border);
}

.tab-btn {
  flex: 1;
  padding: 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: var(--transition-fast);
}

.tab-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.tab-btn.active {
  color: var(--accent-purple);
  background: rgba(139, 92, 246, 0.05);
  border-bottom: 2px solid var(--accent-purple);
}

.auth-body {
  padding: 40px 32px;
}

.auth-title {
  font-size: 1.8rem;
  margin-bottom: 8px;
  text-align: center;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.4;
}

.auth-form {
  display: flex;
  flex-direction: column;
}

.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 0.9rem;
}

.w-full {
  width: 100%;
}

.submit-btn {
  margin-top: 10px;
  padding: 14px;
  font-size: 1rem;
}

.btn-spinner {
  width: 20px;
  height: 20px;
}
</style>
