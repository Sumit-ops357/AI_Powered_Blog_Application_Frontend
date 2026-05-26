<template>
  <nav class="navbar glass">
    <div class="nav-container">
      <router-link to="/" class="logo-link">
        <span class="logo-icon">✨</span>
        <span class="logo-text">Cosmic<span class="text-gradient">Blog</span></span>
      </router-link>

      <div class="nav-links">
        <router-link to="/" class="nav-item">
          <GlobeIcon :size="18" />
          <span>Explore</span>
        </router-link>

        <template v-if="isAuthenticated">
          <router-link to="/editor" class="nav-item">
            <PenSquareIcon :size="18" />
            <span>Write</span>
          </router-link>

          <router-link to="/dashboard" class="nav-item">
            <LayoutDashboardIcon :size="18" />
            <span>Dashboard</span>
          </router-link>

          <router-link :to="`/profile/${userId}`" class="nav-item profile-badge">
            <UserIcon :size="16" />
            <span class="username">{{ userName }}</span>
          </router-link>

          <button @click="handleLogout" class="btn btn-secondary logout-btn">
            <LogOutIcon :size="16" />
            <span>Logout</span>
          </button>
        </template>

        <template v-else>
          <router-link to="/auth" class="btn btn-primary login-btn">
            <LogInIcon :size="16" />
            <span>Get Started</span>
          </router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '@/store/auth'
import { 
  Globe as GlobeIcon, 
  PenSquare as PenSquareIcon, 
  LayoutDashboard as LayoutDashboardIcon, 
  User as UserIcon, 
  LogOut as LogOutIcon, 
  LogIn as LogInIcon 
} from 'lucide-vue-next'

const router = useRouter()

const isAuthenticated = computed(() => authStore.isAuthenticated.value)
const userId = computed(() => authStore.userId.value)
const userName = computed(() => authStore.user.value?.name || '')

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  z-index: 1000;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
}

.nav-container {
  width: 100%;
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
}

.logo-icon {
  font-size: 1.6rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.95rem;
  color: var(--text-secondary);
  transition: var(--transition-fast);
}

.nav-item:hover, .router-link-active.nav-item {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.router-link-active.nav-item {
  border-bottom: 2px solid var(--accent-purple);
  border-radius: 10px 10px 0 0;
  background: rgba(255, 255, 255, 0.03);
}

.profile-badge {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.profile-badge:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.4);
  color: #c084fc;
}

.username {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  padding: 8px 14px;
  font-size: 0.9rem;
}

.login-btn {
  padding: 10px 18px;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .username {
    display: none;
  }
  .nav-item span {
    display: none;
  }
  .nav-links {
    gap: 8px;
  }
}
</style>
