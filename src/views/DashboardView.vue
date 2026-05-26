<template>
  <div class="dashboard-container animate-fade-in">
    <!-- Header -->
    <header class="dash-header">
      <div class="header-text">
        <h1 class="dash-title">Author <span class="text-gradient">Workspace</span></h1>
        <p class="dash-subtitle">Track your article metrics, manage draft releases, and view cosmic analytics.</p>
      </div>
      <router-link to="/editor" class="btn btn-primary new-post-btn">
        <PlusIcon :size="18" />
        <span>Create Article</span>
      </router-link>
    </header>

    <!-- Global Loader -->
    <div v-if="loading" class="loader-container">
      <div class="spinner"></div>
      <p>Gathering the metric constellations...</p>
    </div>

    <div v-else class="dash-content">
      <!-- Analytics Grid Row -->
      <section class="metrics-grid">
        <div class="metric-card glass-card purple-glow">
          <div class="metric-icon-wrap bg-purple">
            <BookOpenIcon :size="24" />
          </div>
          <div class="metric-info">
            <span class="metric-label">Total Articles</span>
            <h3 class="metric-value">{{ stats.totalBlogs }}</h3>
          </div>
        </div>

        <div class="metric-card glass-card cyan-glow">
          <div class="metric-icon-wrap bg-cyan">
            <EyeIcon :size="24" />
          </div>
          <div class="metric-info">
            <span class="metric-label">Total Readership</span>
            <h3 class="metric-value">{{ stats.totalViews }}</h3>
          </div>
        </div>

        <div class="metric-card glass-card pink-glow">
          <div class="metric-icon-wrap bg-pink">
            <HeartIcon :size="24" />
          </div>
          <div class="metric-info">
            <span class="metric-label">Likes Received</span>
            <h3 class="metric-value">{{ stats.totalLikes }}</h3>
          </div>
        </div>

        <div class="metric-card glass-card amber-glow">
          <div class="metric-icon-wrap bg-amber">
            <MessageSquareIcon :size="24" />
          </div>
          <div class="metric-info">
            <span class="metric-label">Comments Written</span>
            <h3 class="metric-value">{{ stats.commentsWritten }}</h3>
          </div>
        </div>
      </section>

      <!-- Grid for Popular Blog & Main Management Table -->
      <div class="workspace-grid">
        <!-- Left: Blogs Management -->
        <main class="blogs-management glass-card">
          <h3 class="panel-heading">Manage Your Articles</h3>

          <div v-if="myBlogs.length === 0" class="no-blogs-prompt">
            <span class="prompt-icon">✍️</span>
            <h4>No articles drafted yet</h4>
            <p>Ready to leave your mark? Start writing and publishing your ideas today!</p>
            <router-link to="/editor" class="btn btn-primary">Create Your First Blog</router-link>
          </div>

          <div v-else class="table-responsive">
            <table class="blogs-table">
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Readership</th>
                  <th>Likes</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="blog in myBlogs" :key="blog.id">
                  <td>
                    <div class="table-blog-details" @click="viewBlog(blog.id)">
                      <img 
                        :src="blog.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60'" 
                        alt="Preview" 
                        class="table-blog-thumb"
                      />
                      <div class="table-blog-info">
                        <span class="table-blog-title">{{ blog.title }}</span>
                        <span class="table-blog-date">Saved {{ formatDate(blog.updatedAt) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span :class="['badge', blog.status === 'PUBLISHED' ? 'badge-green' : 'badge-amber']">
                      {{ blog.status }}
                    </span>
                  </td>
                  <td>
                    <span class="table-category">{{ blog.category || 'Tech' }}</span>
                  </td>
                  <td>
                    <span class="stat-cell"><EyeIcon :size="14" /> {{ blog.views }}</span>
                  </td>
                  <td>
                    <span class="stat-cell"><HeartIcon :size="14" /> {{ blog.likedBy?.length || 0 }}</span>
                  </td>
                  <td class="text-right">
                    <div class="action-buttons">
                      <button @click="editBlog(blog.id)" class="btn-action edit" title="Edit Article">
                        <EditIcon :size="16" />
                      </button>
                      <button @click="deleteBlog(blog.id)" class="btn-action delete" title="Delete Article">
                        <TrashIcon :size="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>

        <!-- Right: Star Post Spot -->
        <aside class="star-post-panel" v-if="stats.popularBlog">
          <div class="star-card glass-card">
            <span class="star-badge">🏆 TOP PERFORMING ARTICLE</span>
            <div class="star-image-container">
              <img 
                :src="stats.popularBlog.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80'" 
                alt="Popular Cover"
                class="star-image"
              />
            </div>
            <h4 class="star-title" @click="viewBlog(stats.popularBlog.id)">{{ stats.popularBlog.title }}</h4>
            <p class="star-excerpt">{{ stats.popularBlog.summary || truncateText(stats.popularBlog.content, 90) }}</p>
            
            <div class="star-stats">
              <span class="star-stat"><EyeIcon :size="14" /> {{ stats.popularBlog.views }} views</span>
              <span class="star-stat"><HeartIcon :size="14" /> {{ stats.popularBlog.likedBy?.length || 0 }} likes</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, type Blog, type Analytics } from '@/services/api'
import { 
  Plus as PlusIcon, 
  BookOpen as BookOpenIcon, 
  Eye as EyeIcon, 
  Heart as HeartIcon, 
  MessageSquare as MessageSquareIcon,
  Edit3 as EditIcon,
  Trash2 as TrashIcon
} from 'lucide-vue-next'

const router = useRouter()

const loading = ref(true)
const myBlogs = ref<Blog[]>([])

// Reactive Analytics State
const stats = reactive<Analytics>({
  totalBlogs: 0,
  totalViews: 0,
  totalLikes: 0,
  commentsWritten: 0,
  popularBlog: null
})

const loadWorkspaceData = async () => {
  loading.value = true
  try {
    // 1. Fetch own Blogs
    const blogsRes = await api.blogs.getMine()
    myBlogs.value = blogsRes

    // 2. Fetch Analytics
    const analyticsRes = await api.analytics.getMe()
    stats.totalBlogs = analyticsRes.totalBlogs
    stats.totalViews = analyticsRes.totalViews
    stats.totalLikes = analyticsRes.totalLikes
    stats.commentsWritten = analyticsRes.commentsWritten
    stats.popularBlog = analyticsRes.popularBlog
  } catch (err) {
    console.error('Failed to load dashboard data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadWorkspaceData()
})

const viewBlog = (id: string) => {
  router.push(`/blog/${id}`)
}

const editBlog = (id: string) => {
  router.push(`/editor/${id}`)
}

const deleteBlog = async (id: string) => {
  if (!confirm('Are you sure you want to permanently delete this article?')) return
  try {
    await api.blogs.delete(id)
    myBlogs.value = myBlogs.value.filter((b: Blog) => b.id !== id)
    // Reload metrics
    const analyticsRes = await api.analytics.getMe()
    stats.totalBlogs = analyticsRes.totalBlogs
    stats.totalViews = analyticsRes.totalViews
    stats.totalLikes = analyticsRes.totalLikes
    stats.commentsWritten = analyticsRes.commentsWritten
    stats.popularBlog = analyticsRes.popularBlog
  } catch (err) {
    console.error('Failed to delete blog:', err)
  }
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
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
}

.dash-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.header-text {
  text-align: left;
}

.dash-title {
  font-size: 2.2rem;
  font-weight: 800;
}

.text-gradient {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dash-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.new-post-btn {
  padding: 12px 24px;
  font-size: 0.95rem;
}

/* Global Loader */
.loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  gap: 16px;
  color: var(--text-secondary);
}

/* Metrics Row */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  border-radius: 20px;
  text-align: left;
  border: 1px solid var(--border);
}

.metric-icon-wrap {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.bg-purple { background: rgba(139, 92, 246, 0.2); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.3); }
.bg-cyan { background: rgba(6, 182, 212, 0.2); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.3); }
.bg-pink { background: rgba(217, 70, 239, 0.2); color: #f472b6; border: 1px solid rgba(217, 70, 239, 0.3); }
.bg-amber { background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

/* Glow variants */
.purple-glow:hover { box-shadow: 0 8px 30px rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); }
.cyan-glow:hover { box-shadow: 0 8px 30px rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.3); }
.pink-glow:hover { box-shadow: 0 8px 30px rgba(217, 70, 239, 0.15); border-color: rgba(217, 70, 239, 0.3); }
.amber-glow:hover { box-shadow: 0 8px 30px rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.metric-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

/* Workspace Grid Layout */
.workspace-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 30px;
  align-items: start;
}

.blogs-management {
  padding: 32px;
  border-radius: 24px;
  text-align: left;
}

.panel-heading {
  font-size: 1.25rem;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.no-blogs-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 60px 0;
  gap: 16px;
}

.prompt-icon {
  font-size: 3rem;
}

.no-blogs-prompt p {
  color: var(--text-secondary);
  max-width: 400px;
  margin-bottom: 8px;
}

/* Tables Styling */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

.blogs-table {
  width: 100%;
  border-collapse: collapse;
}

.blogs-table th {
  padding: 12px 16px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
  font-weight: 700;
  text-align: left;
}

.blogs-table td {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.blogs-table tr:last-child td {
  border-bottom: none;
}

.table-blog-details {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.table-blog-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.table-blog-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.table-blog-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-blog-title:hover {
  color: var(--accent-purple);
}

.table-blog-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.table-category {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.stat-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.text-right {
  text-align: right;
}

.blogs-table th.text-right {
  text-align: right;
}

/* Action button icons */
.btn-action {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  color: var(--text-muted);
  transition: var(--transition-fast);
}

.btn-action:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
}

.btn-action.edit:hover {
  color: var(--accent-purple);
  border-color: rgba(139, 92, 246, 0.3);
  background: rgba(139, 92, 246, 0.08);
}

.btn-action.delete:hover {
  color: var(--accent-red);
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.08);
}

/* Popular Star card */
.star-post-panel {
  display: flex;
  flex-direction: column;
}

.star-card {
  padding: 24px;
  border-radius: 20px;
  text-align: left;
}

.star-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--accent-amber);
  background: rgba(245, 158, 11, 0.1);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(245, 158, 11, 0.2);
  margin-bottom: 16px;
  letter-spacing: 0.05em;
}

.star-image-container {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.star-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.star-title {
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 8px;
  cursor: pointer;
}

.star-title:hover {
  color: var(--accent-purple);
}

.star-excerpt {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.star-stats {
  display: flex;
  gap: 16px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.star-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .dash-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .workspace-grid {
    grid-template-columns: 1fr;
  }
  .blogs-management {
    padding: 20px;
  }
}
</style>
