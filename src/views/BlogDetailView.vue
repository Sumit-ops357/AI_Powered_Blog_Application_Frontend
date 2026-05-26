<template>
  <div class="blog-detail-container animate-fade-in">
    <!-- Loader -->
    <div v-if="loading" class="loader-container">
      <div class="spinner"></div>
      <p>Consulting the stars for the article...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container glass-card">
      <span class="error-icon">🪐</span>
      <h3>Failed to Load Article</h3>
      <p>{{ error }}</p>
      <router-link to="/" class="btn btn-primary">Go Back Explore</router-link>
    </div>

    <!-- Full Article View -->
    <div v-else-if="blog" class="article-layout">
      <!-- Cover Image -->
      <div class="article-cover-wrapper glass">
        <img 
          :src="blog.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'" 
          alt="Article cover" 
          class="article-cover"
        />
        <div class="cover-overlay"></div>
        <div class="cover-meta-content">
          <span class="badge badge-cyan category-badge">{{ blog.category || 'Tech' }}</span>
          <h1 class="article-title">{{ blog.title }}</h1>
        </div>
      </div>

      <!-- Article Shell Grid -->
      <div class="article-grid">
        <!-- Main Content -->
        <main class="article-main glass-card">
          <!-- Stats Top -->
          <div class="stats-top">
            <span class="stat-info">Published {{ formatDate(blog.createdAt) }}</span>
            <span class="stat-info-right">
              <span class="stat-bubble"><EyeIcon :size="14" /> {{ blog.views }} views</span>
              <span class="stat-bubble"><HeartIcon :size="14" /> {{ blog.likedBy?.length || 0 }} likes</span>
            </span>
          </div>

          <!-- Body Content -->
          <div class="article-content" v-html="formattedContent"></div>

          <!-- Tags List -->
          <div class="article-tags" v-if="blog.tags && blog.tags.length > 0">
            <span v-for="tag in blog.tags" :key="tag" class="tag-badge">#{{ tag }}</span>
          </div>

          <!-- Interaction Footer -->
          <div class="interaction-footer">
            <button 
              @click="handleLike" 
              :class="['interact-btn', 'like-btn', { active: isLiked }]"
              :disabled="!isAuthenticated"
              :title="isAuthenticated ? 'Like this article' : 'Login to like'"
            >
              <HeartIcon :size="20" :fill="isLiked ? '#ef4444' : 'transparent'" />
              <span>{{ isLiked ? 'Liked' : 'Like' }} ({{ blog.likedBy?.length || 0 }})</span>
            </button>

            <button 
              @click="handleBookmark" 
              :class="['interact-btn', 'bookmark-btn', { active: isBookmarked }]"
              :disabled="!isAuthenticated"
              :title="isAuthenticated ? 'Bookmark this article' : 'Login to bookmark'"
            >
              <BookmarkIcon :size="20" :fill="isBookmarked ? '#f59e0b' : 'transparent'" />
              <span>{{ isBookmarked ? 'Bookmarked' : 'Bookmark' }}</span>
            </button>
          </div>
        </main>

        <!-- Sidebar (Author Information) -->
        <aside class="article-sidebar">
          <div class="author-card glass-card">
            <h3 class="sidebar-title">The Author</h3>
            <div class="author-info">
              <div class="author-avatar">
                {{ blog.authorId.slice(0, 2).toUpperCase() }}
              </div>
              <div class="author-details">
                <h4 class="author-name" @click="viewAuthor(blog.authorId)">Creator</h4>
                <span class="author-sub">Member since 2026</span>
              </div>
            </div>
            
            <p class="author-bio" v-if="authorProfile?.bio">{{ authorProfile.bio }}</p>
            <p class="author-bio" v-else>Active writer sharing insights, details, and ideas within our cosmic space.</p>
            
            <button 
              v-if="blog.authorId !== currentUserId"
              @click="handleFollow" 
              :class="['btn', isFollowing ? 'btn-secondary' : 'btn-primary', 'w-full', 'follow-btn']"
              :disabled="!isAuthenticated"
            >
              <UserPlusIcon v-if="!isFollowing" :size="16" />
              <UserXIcon v-else :size="16" />
              <span>{{ isFollowing ? 'Following' : 'Follow Author' }}</span>
            </button>
            <p v-else class="own-profile-label">⭐ This is your article</p>
          </div>
        </aside>
      </div>

      <!-- Comments Section -->
      <section class="comments-section glass-card">
        <h2 class="section-title">
          <MessageSquareIcon :size="24" />
          <span>Discussion ({{ comments.length }})</span>
        </h2>

        <!-- New Comment Input -->
        <div v-if="isAuthenticated" class="comment-input-block">
          <textarea 
            v-model="newComment" 
            class="form-textarea comment-textarea" 
            placeholder="Share your thoughts on this space..."
            rows="3"
          ></textarea>
          <div class="comment-submit-row">
            <button 
              @click="submitComment" 
              class="btn btn-primary submit-comment-btn"
              :disabled="!newComment.trim() || commentLoading"
            >
              <span v-if="commentLoading" class="spinner btn-spinner"></span>
              <span v-else>Post Comment</span>
            </button>
          </div>
        </div>
        
        <div v-else class="login-prompt glass">
          <p>Want to join the cosmic discussion? <router-link to="/auth" class="auth-link">Sign in</router-link> to post comments!</p>
        </div>

        <!-- Comments List -->
        <div v-if="comments.length === 0" class="no-comments">
          <p>No comments yet. Be the first to spark the conversation!</p>
        </div>

        <div v-else class="comments-list">
          <div 
            v-for="comment in comments" 
            :key="comment.id" 
            class="comment-card glass"
          >
            <div class="comment-header">
              <div class="commenter-avatar">
                {{ comment.authorName.slice(0, 2).toUpperCase() }}
              </div>
              <div class="commenter-meta">
                <span class="commenter-name">{{ comment.authorName }}</span>
                <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
              </div>
              
              <button 
                v-if="comment.authorId === currentUserId"
                @click="deleteComment(comment.id)" 
                class="btn-delete"
                title="Delete comment"
              >
                <TrashIcon :size="16" />
              </button>
            </div>
            <p class="comment-text">{{ comment.message }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, type Blog, type Comment, type UserProfile } from '@/services/api'
import { authStore } from '@/store/auth'
import { 
  Eye as EyeIcon, 
  Heart as HeartIcon, 
  Bookmark as BookmarkIcon, 
  UserPlus as UserPlusIcon, 
  UserX as UserXIcon, 
  MessageSquare as MessageSquareIcon,
  Trash2 as TrashIcon
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const blogId = route.params.id as string

const blog = ref<Blog | null>(null)
const authorProfile = ref<UserProfile | null>(null)
const comments = ref<Comment[]>([])
const loading = ref(true)
const error = ref('')

const isFollowing = ref(false)
const newComment = ref('')
const commentLoading = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated.value)
const currentUserId = computed(() => authStore.userId.value)

const isLiked = computed(() => {
  if (!blog.value || !currentUserId.value) return false
  return blog.value.likedBy.includes(currentUserId.value)
})

const isBookmarked = computed(() => {
  if (!blog.value || !currentUserId.value) return false
  return blog.value.bookmarkedBy.includes(currentUserId.value)
})

const formattedContent = computed(() => {
  if (!blog.value) return ''
  // Convert standard newlines to paragraphs for beautiful reading format
  return blog.value.content
    .split('\n\n')
    .map((para: string) => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
    .join('')
})

const loadArticle = async () => {
  loading.value = true
  error.value = ''
  try {
    // 1. Fetch Blog
    const res = await api.blogs.getById(blogId)
    blog.value = res

    // 2. Fetch Author profile
    try {
      const authProf = await api.social.getProfile(res.authorId)
      authorProfile.value = authProf
      
      // Check if following
      if (isAuthenticated.value) {
        try {
          const myProf = await api.social.getProfile(currentUserId.value)
          isFollowing.value = myProf.following.includes(res.authorId)
        } catch (_) {}
      }
    } catch (_) {}

    // 3. Fetch Comments
    const comms = await api.comments.getForBlog(blogId)
    comments.value = comms
  } catch (err: any) {
    error.value = err.message || 'Article could not be found or fetched.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadArticle()
})

const handleLike = async () => {
  if (!isAuthenticated.value || !blog.value) return
  try {
    const updated = await api.social.toggleLike(blog.value.id)
    blog.value.likedBy = updated.likedBy
  } catch (err) {
    console.error('Like toggle failed:', err)
  }
}

const handleBookmark = async () => {
  if (!isAuthenticated.value || !blog.value) return
  try {
    const updated = await api.social.toggleBookmark(blog.value.id)
    blog.value.bookmarkedBy = updated.bookmarkedBy
  } catch (err) {
    console.error('Bookmark toggle failed:', err)
  }
}

const handleFollow = async () => {
  if (!isAuthenticated.value || !blog.value) return
  try {
    const updatedUser = await api.social.toggleFollow(blog.value.authorId)
    isFollowing.value = updatedUser.following.includes(blog.value.authorId)
  } catch (err) {
    console.error('Follow toggle failed:', err)
  }
}

const submitComment = async () => {
  if (!isAuthenticated.value || !newComment.value.trim() || commentLoading.value) return
  commentLoading.value = true
  try {
    const freshComment = await api.comments.add(blogId, newComment.value)
    comments.value.unshift(freshComment)
    newComment.value = ''
  } catch (err) {
    console.error('Failed to submit comment:', err)
  } finally {
    commentLoading.value = false
  }
}

const deleteComment = async (id: string) => {
  if (!confirm('Are you sure you want to delete this comment?')) return
  try {
    await api.comments.delete(id)
    comments.value = comments.value.filter((c: Comment) => c.id !== id)
  } catch (err) {
    console.error('Failed to delete comment:', err)
  }
}

const viewAuthor = (id: string) => {
  router.push(`/profile/${id}`)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.blog-detail-container {
  max-width: 1100px;
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

/* Cover section */
.article-cover-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: var(--shadow-md);
}

.article-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(11, 15, 25, 0.95) 10%, rgba(11, 15, 25, 0.2) 100%);
  z-index: 1;
}

.cover-meta-content {
  position: absolute;
  bottom: 32px;
  left: 32px;
  right: 32px;
  z-index: 2;
  text-align: left;
}

.category-badge {
  margin-bottom: 16px;
}

.article-title {
  font-size: 2.8rem;
  font-weight: 800;
  line-height: 1.25;
  color: var(--text-primary);
}

/* Article Shell Grid */
.article-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 30px;
  margin-bottom: 40px;
}

.article-main {
  padding: 32px;
  border-radius: 20px;
  text-align: left;
}

.stats-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 28px;
  border-bottom: 1px solid var(--border);
  padding-bottom: 16px;
}

.stat-bubble {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-left: 10px;
}

.article-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #e5e7eb;
}

.article-content :deep(p) {
  margin-bottom: 24px;
}

.article-content :deep(p:last-child) {
  margin-bottom: 0;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 32px;
  border-top: 1px solid var(--border);
  padding-top: 24px;
}

.tag-badge {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-purple);
  padding: 4px 12px;
  background: rgba(139, 92, 246, 0.08);
  border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.15);
}

.interaction-footer {
  display: flex;
  gap: 16px;
  margin-top: 32px;
  border-top: 1px solid var(--border);
  padding-top: 24px;
}

.interact-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-sans);
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.interact-btn:hover:not(:disabled) {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.interact-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.like-btn.active {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.bookmark-btn.active {
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.3);
}

/* Sidebar */
.article-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.author-card {
  padding: 24px;
  border-radius: 20px;
  text-align: left;
}

.sidebar-title {
  font-size: 1.1rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 800;
  color: white;
  box-shadow: var(--shadow-sm);
}

.author-name {
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
}

.author-name:hover {
  color: var(--accent-purple);
}

.author-sub {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.author-bio {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}

.follow-btn {
  font-size: 0.9rem;
}

.own-profile-label {
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-muted);
  padding: 8px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px dashed var(--border);
}

/* Comments section */
.comments-section {
  padding: 32px;
  border-radius: 20px;
  text-align: left;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.4rem;
  margin-bottom: 28px;
  color: var(--text-primary);
}

.comment-input-block {
  margin-bottom: 32px;
}

.comment-textarea {
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 12px;
}

.comment-submit-row {
  display: flex;
  justify-content: flex-end;
}

.submit-comment-btn {
  padding: 10px 24px;
  font-size: 0.95rem;
}

.btn-spinner {
  width: 18px;
  height: 18px;
}

.login-prompt {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 32px;
}

.auth-link {
  color: var(--accent-purple);
  font-weight: 600;
}

.auth-link:hover {
  color: var(--accent-pink);
  text-decoration: underline;
}

.no-comments {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px 0;
  border: 1px dashed var(--border);
  border-radius: 12px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-card {
  padding: 20px;
  border-radius: 16px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  position: relative;
}

.commenter-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.commenter-meta {
  display: flex;
  flex-direction: column;
}

.commenter-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.comment-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.btn-delete {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: var(--transition-fast);
}

.btn-delete:hover {
  color: var(--accent-red);
  background: rgba(239, 68, 68, 0.1);
}

.comment-text {
  font-size: 0.95rem;
  color: #d1d5db;
  line-height: 1.5;
  padding-left: 42px;
}

@media (max-width: 900px) {
  .article-title {
    font-size: 2rem;
  }
  .article-cover-wrapper {
    height: 300px;
  }
  .article-grid {
    grid-template-columns: 1fr;
  }
  .article-main {
    padding: 20px;
  }
  .comments-section {
    padding: 20px;
  }
}
</style>
