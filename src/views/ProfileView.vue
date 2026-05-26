<template>
  <div class="profile-container animate-fade-in">
    <!-- Loader -->
    <div v-if="loading" class="loader-container">
      <div class="spinner"></div>
      <p>Locating the coordinate files for this author...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container glass-card">
      <span class="error-icon">🪐</span>
      <h3>Author Not Found</h3>
      <p>{{ error }}</p>
      <router-link to="/" class="btn btn-primary">Back to Explore</router-link>
    </div>

    <div v-else-if="profile" class="profile-layout">
      <!-- Profile Header Card -->
      <header class="profile-header-card glass-card">
        <div class="profile-header-glow"></div>
        
        <div class="profile-header-content">
          <div class="giant-avatar">
            {{ profile.name.slice(0, 2).toUpperCase() }}
          </div>

          <div class="profile-identity">
            <div class="name-row">
              <h2 class="profile-name">{{ profile.name }}</h2>
              <span class="badge badge-purple status-role">Author</span>
            </div>
            
            <p class="profile-email">{{ profile.email }}</p>
            <p class="profile-bio">{{ profile.bio || 'This author has not written a custom bio yet, but they are an active contributor inside our cosmic blog ecosystem!' }}</p>
            
            <div class="profile-stats-row">
              <div class="profile-stat-item">
                <span class="stat-num">{{ authorBlogs.length }}</span>
                <span class="stat-lbl">Articles Published</span>
              </div>
              <div class="profile-stat-item">
                <span class="stat-num">{{ profile.following?.length || 0 }}</span>
                <span class="stat-lbl">Following</span>
              </div>
            </div>
          </div>

          <!-- Follow Action Button -->
          <div class="follow-action-wrap" v-if="profile.id !== currentUserId">
            <button 
              @click="handleFollow" 
              :class="['btn', isFollowing ? 'btn-secondary' : 'btn-primary', 'follow-profile-btn']"
              :disabled="!isAuthenticated"
              :title="isAuthenticated ? 'Follow' : 'Login to follow'"
            >
              <UserPlusIcon v-if="!isFollowing" :size="16" />
              <UserXIcon v-else :size="16" />
              <span>{{ isFollowing ? 'Following' : 'Follow Author' }}</span>
            </button>
          </div>
          <div class="follow-action-wrap" v-else>
            <router-link to="/dashboard" class="btn btn-secondary follow-profile-btn">
              <span>Go Workspace</span>
            </router-link>
          </div>
        </div>
      </header>

      <!-- Author's Articles Grid -->
      <section class="author-articles-section">
        <h3 class="section-title">Articles Published by {{ profile.name }}</h3>

        <div v-if="authorBlogs.length === 0" class="no-articles-card glass-card">
          <span class="no-art-icon">🪐</span>
          <h4>No published articles yet</h4>
          <p>This author hasn't released any articles to the public gallery yet. Check back later!</p>
        </div>

        <div v-else class="blog-grid">
          <article 
            v-for="blog in authorBlogs" 
            :key="blog.id" 
            @click="viewBlog(blog.id)"
            class="blog-card glass-card"
          >
            <div class="card-cover-container">
              <img 
                :src="blog.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60'" 
                alt="Cover" 
                class="card-cover"
              />
              <div class="card-category">
                <span class="badge badge-purple">{{ blog.category || 'Tech' }}</span>
              </div>
            </div>

            <div class="card-content">
              <h2 class="card-title">{{ blog.title }}</h2>
              <p class="card-summary">{{ blog.summary || truncateText(blog.content, 110) }}</p>

              <div class="card-tags" v-if="blog.tags && blog.tags.length > 0">
                <span v-for="tag in blog.tags.slice(0, 3)" :key="tag" class="tag-item">#{{ tag }}</span>
              </div>

              <div class="card-footer">
                <span class="card-date">{{ formatDate(blog.createdAt) }}</span>
                <div class="card-stats">
                  <span class="stat-item">
                    <EyeIcon :size="14" />
                    <span>{{ blog.views }}</span>
                  </span>
                  <span class="stat-item">
                    <HeartIcon :size="14" />
                    <span>{{ blog.likedBy?.length || 0 }}</span>
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, type Blog, type UserProfile } from '@/services/api'
import { authStore } from '@/store/auth'
import { 
  Eye as EyeIcon, 
  Heart as HeartIcon, 
  UserPlus as UserPlusIcon, 
  UserX as UserXIcon 
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const profile = ref<UserProfile | null>(null)
const authorBlogs = ref<Blog[]>([])
const isFollowing = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated.value)
const currentUserId = computed(() => authStore.userId.value)

const loadProfileData = async (id: string) => {
  loading.value = true
  error.value = ''
  try {
    // 1. Fetch profile
    const profRes = await api.social.getProfile(id)
    profile.value = profRes

    // 2. Fetch all published blogs, filter by this author
    const blogsRes = await api.blogs.getAll()
    authorBlogs.value = blogsRes.filter((blog: Blog) => blog.authorId === id)

    // 3. Check follow status
    if (isAuthenticated.value && id !== currentUserId.value) {
      try {
        const myProf = await api.social.getProfile(currentUserId.value)
        isFollowing.value = myProf.following.includes(id)
      } catch (_) {}
    }
  } catch (err: any) {
    error.value = err.message || 'Profile could not be resolved.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfileData(route.params.id as string)
})

// Watch for route changes to reload profile
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadProfileData(newId as string)
  }
})

const handleFollow = async () => {
  if (!isAuthenticated.value || !profile.value) return
  try {
    await api.social.toggleFollow(profile.value.id)
    // Check if following
    const myProf = await api.social.getProfile(currentUserId.value)
    isFollowing.value = myProf.following.includes(profile.value.id)
  } catch (err) {
    console.error('Follow toggle failed:', err)
  }
}

const viewBlog = (id: string) => {
  router.push(`/blog/${id}`)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const truncateText = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 16px;
  color: var(--text-secondary);
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 40px;
  gap: 20px;
}

.error-icon {
  font-size: 3.5rem;
}

.error-container p {
  color: var(--text-secondary);
  margin-bottom: 12px;
}

/* Header profile card */
.profile-header-card {
  position: relative;
  padding: 40px;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 40px;
  text-align: left;
}

.profile-header-glow {
  position: absolute;
  top: -50%;
  left: 0;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.profile-header-content {
  display: flex;
  align-items: center;
  gap: 32px;
  position: relative;
  z-index: 1;
}

.giant-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.8rem;
  font-weight: 800;
  color: white;
  box-shadow: var(--shadow-md), 0 0 20px rgba(139, 92, 246, 0.2);
  flex-shrink: 0;
}

.profile-identity {
  flex-grow: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.profile-name {
  font-size: 2rem;
  font-weight: 800;
  color: var(--text-primary);
}

.status-role {
  padding: 2px 8px;
  font-size: 0.7rem;
}

.profile-email {
  font-size: 0.95rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.profile-bio {
  font-size: 1.05rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 20px;
  max-width: 700px;
}

.profile-stats-row {
  display: flex;
  gap: 28px;
}

.profile-stat-item {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-lbl {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.follow-action-wrap {
  flex-shrink: 0;
}

.follow-profile-btn {
  padding: 12px 24px;
  font-size: 0.95rem;
}

/* Articles list section */
.author-articles-section {
  text-align: left;
}

.section-title {
  font-size: 1.4rem;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.no-articles-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 40px;
  gap: 16px;
}

.no-art-icon {
  font-size: 3.5rem;
}

.no-articles-card h4 {
  font-size: 1.25rem;
}

.no-articles-card p {
  color: var(--text-secondary);
  max-width: 450px;
}

/* Blog grid details override */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 30px;
}

.blog-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
}

.card-cover-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.card-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

.blog-card:hover .card-cover {
  transform: scale(1.08);
}

.card-category {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 1;
}

.card-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 24px;
}

.card-title {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 10px;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-summary {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.tag-item {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-purple);
  padding: 2px 8px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 4px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  padding-top: 16px;
  margin-top: auto;
}

.card-date {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.card-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .profile-header-content {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
  .profile-header-card {
    padding: 24px;
  }
  .profile-stats-row {
    justify-content: center;
  }
  .blog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
