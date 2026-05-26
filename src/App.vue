<template>
  <div id="app">
    <!-- Sticky Glassmorphism Header -->
    <Navbar />

    <!-- Main Viewport Router Container -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Navbar from '@/components/Navbar.vue'
import { authStore } from '@/store/auth'

onMounted(() => {
  // Restore user session token and details from localStorage on load
  authStore.initialize()
})
</script>

<style>
/* Global resets or layout styles can go here if needed, but style.css is already active */
</style>
