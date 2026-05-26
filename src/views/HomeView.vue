<template>
  <div class="home-explore animate-fade-in">
    <!-- Hero Banner -->
    <header class="hero-section glass">
      <div class="hero-glow"></div>
      <h1 class="hero-title">Cosmic <span class="text-gradient">Space of Thoughts</span></h1>
      <p class="hero-subtitle">Explore cutting-edge blogs, AI assistance tools, and shared perspectives from creative minds around the world.</p>
    </header>

    <!-- Search and Controls Bar -->
    <div class="controls-bar glass-card">
      <div class="search-box">
        <SearchIcon class="search-icon" :size="20" />
        <input 
          type="text" 
          v-model="searchQuery" 
          @input="debounceSearch"
          placeholder="Search articles, keywords, or topics..." 
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">✕</button>
      </div>

      <div class="sort-selector">
        <span class="sort-label">Sort by:</span>
        <button 
          @click="changeSort('date')" 
          :class="['sort-btn', { active: currentSort === 'date' }]"
        >
          <CalendarIcon :size="16" />
          <span>Newest</span>
        </button>
        <button 
          @click="changeSort('popular')" 
          :class="['sort-btn', { active: currentSort === 'popular' }]"
        >
          <FlameIcon :size="16" />
          <span>Popular</span>
        </button>
      </div>
    </div>

    <!-- Category Filters -->
    <div class="categories-container">
      <button 
        @click="selectCategory('')" 
        :class="['category-badge', { active: selectedCategory === '' }]"
      >
        All Topics
      </button>
      <button 
        v-for="cat in categories" 
        :key="cat"
        @click="selectCategory(cat)"
        :class="['category-badge', { active: selectedCategory === cat }]"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loader-container">
      <div class="spinner"></div>
      <p>Traversing the blog galaxy...</p>
    </div>

    <!-- Empty Feed State -->
    <div v-else-if="blogs.length === 0" class="empty-state glass-card">
      <div class="empty-icon">🪐</div>
      <h3>No Blogs Found</h3>
      <p>We couldn't find any published blogs matching your current filters. Try search keywords or check back later!</p>
      <button @click="resetFilters" class="btn btn-primary reset-btn">Reset Filters</button>
    </div>

    <!-- Blog Grid -->
    <div v-else class="blog-grid">
      <article 
        v-for="blog in blogs" 
        :key="blog.id" 
        @click="viewBlog(blog.id)"
        class="blog-card glass-card"
      >
        <div class="card-cover-container">
          <img 
            :src="blog.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60'" 
            alt="Blog cover image" 
            class="card-cover"
          />
          <div class="card-category">
            <span class="badge badge-purple">{{ blog.category || 'Tech' }}</span>
          </div>
        </div>

        <div class="card-content">
          <h2 class="card-title">{{ blog.title }}</h2>
          <p class="card-summary">{{ blog.summary || truncateText(blog.content, 120) }}</p>

          <div class="card-tags" v-if="blog.tags && blog.tags.length > 0">
            <span 
              v-for="tag in blog.tags.slice(0, 3)" 
              :key="tag" 
              class="tag-item"
              @click.stop="selectTag(tag)"
            >
              #{{ tag }}
            </span>
          </div>
          
          <div class="card-footer">
            <div class="author-meta" @click.stop="viewAuthor(blog.authorId)">
              <div class="avatar-placeholder">
                {{ blog.authorId.slice(0, 2).toUpperCase() }}
              </div>
              <span class="author-label">Author profile</span>
            </div>

            <div class="card-stats">
              <span class="stat-item" title="Total Views">
                <EyeIcon :size="14" />
                <span>{{ blog.views }}</span>
              </span>
              <span class="stat-item" title="Likes">
                <HeartIcon :size="14" class="icon-like" />
                <span>{{ blog.likedBy?.length || 0 }}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, type Blog } from '@/services/api'
import { 
  Search as SearchIcon, 
  Flame as FlameIcon, 
  Calendar as CalendarIcon, 
  Eye as EyeIcon, 
  Heart as HeartIcon 
} from 'lucide-vue-next'

const router = useRouter()

const blogs = ref<Blog[]>([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedTag = ref('')
const currentSort = ref<'date' | 'popular'>('date')

const categories = ['Technology', 'AI', 'Coding', 'Design', 'Lifestyle', 'Business', 'Travel', 'Science']

let debounceTimeout: any = null

const fetchBlogs = async () => {
  loading.value = true
  try {
    const res = await api.blogs.getAll({
      q: searchQuery.value,
      category: selectedCategory.value,
      tag: selectedTag.value,
      sort: currentSort.value
    })
    blogs.value = res
  } catch (err) {
    console.error('Failed to load blogs:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBlogs()
})

const debounceSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    selectedTag.value = '' // clear tag filter on new search
    fetchBlogs()
  }, 400)
}

const clearSearch = () => {
  searchQuery.value = ''
  fetchBlogs()
}

const selectCategory = (category: string) => {
  selectedCategory.value = category
  selectedTag.value = '' // clear tag
  fetchBlogs()
}

const selectTag = (tag: string) => {
  selectedTag.value = tag
  selectedCategory.value = '' // clear category
  searchQuery.value = '' // clear search
  fetchBlogs()
}

const changeSort = (sort: 'date' | 'popular') => {
  currentSort.value = sort
  fetchBlogs()
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedTag.value = ''
  currentSort.value = 'date'
  fetchBlogs()
}

const viewBlog = (id: string) => {
  router.push(`/blog/${id}`)
}

const viewAuthor = (id: string) => {
  router.push(`/profile/${id}`)
}

const truncateText = (text: string, length: number) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}
</script>

<style scoped>
.home-explore {
  max-width: 1200px;
  margin: 0 auto;
}

.hero-section {
  position: relative;
  text-align: center;
  padding: 60px 24px;
  border-radius: 24px;
  margin-bottom: 40px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.hero-glow {
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 200px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%);
  z-index: 0;
  pointer-events: none;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.15rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Controls Bar */
.controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
}

.search-box {
  position: relative;
  flex-grow: 1;
  max-width: 600px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 12px 48px 12px 48px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  transition: var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-purple);
  background: rgba(255, 255, 255, 0.08);
}

.clear-search-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.clear-search-btn:hover {
  color: var(--text-primary);
}

.sort-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-right: 8px;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.sort-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.sort-btn.active {
  background: rgba(139, 92, 246, 0.15);
  color: #c084fc;
  border-color: rgba(139, 92, 246, 0.3);
}

/* Category Badges */
.categories-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 40px;
}

.category-badge {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 99px;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
}

.category-badge:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border-color: rgba(255, 255, 255, 0.2);
}

.category-badge.active {
  background: var(--gradient-primary);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
}

/* Loading state */
.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 16px;
  color: var(--text-secondary);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 40px;
  gap: 16px;
}

.empty-icon {
  font-size: 4rem;
  animation: bounce 4s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-state h3 {
  font-size: 1.6rem;
}

.empty-state p {
  color: var(--text-secondary);
  max-width: 500px;
}

.reset-btn {
  margin-top: 10px;
  padding: 10px 24px;
}

/* Blog Grid */
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
  text-align: left;
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

.tag-item:hover {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-pink);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  padding-top: 16px;
  margin-top: auto;
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-placeholder {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary);
}

.author-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.author-meta:hover .author-label {
  color: var(--accent-purple);
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

.icon-like {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.2rem;
  }
  .controls-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .sort-selector {
    justify-content: space-between;
  }
  .blog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
