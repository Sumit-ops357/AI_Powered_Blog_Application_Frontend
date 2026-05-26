<template>
  <div class="editor-page animate-fade-in">
    <!-- Loader for edit mode init -->
    <div v-if="initLoading" class="loader-container">
      <div class="spinner"></div>
      <p>Retrieving the galactic scroll...</p>
    </div>

    <div v-else class="editor-grid">
      <!-- Left Panel: Content Editor -->
      <main class="editor-main glass-card">
        <h2 class="editor-heading">{{ isEditMode ? 'Modify Article' : 'Draft New Article' }}</h2>
        
        <form @submit.prevent="saveBlog" class="editor-form">
          <!-- Title Input -->
          <div class="form-group">
            <label class="form-label" for="title">Article Title</label>
            <input 
              type="text" 
              id="title" 
              v-model="form.title" 
              class="form-input title-input" 
              placeholder="Enter a stellar title..." 
              required
            />
          </div>

          <!-- Grid for Category & Tags -->
          <div class="form-row">
            <div class="form-group flex-1">
              <label class="form-label" for="category">Category</label>
              <select id="category" v-model="form.category" class="form-select">
                <option value="" disabled>Select a category</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="form-group flex-1">
              <label class="form-label">Tags (Press Enter to add)</label>
              <div class="tag-input-container">
                <input 
                  type="text" 
                  v-model="tagInput" 
                  @keydown.enter.prevent="addTag"
                  class="form-input" 
                  placeholder="e.g. tech, coding"
                />
                <div class="tag-chips">
                  <span v-for="(tag, index) in form.tags" :key="index" class="tag-chip">
                    #{{ tag }}
                    <button @click.prevent="removeTag(index)" class="remove-tag-btn">✕</button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cover Image Upload -->
          <div class="form-group">
            <label class="form-label">Cover Image</label>
            <div 
              class="image-upload-zone"
              @dragover.prevent="dragOver = true"
              @dragleave.prevent="dragOver = false"
              @drop.prevent="handleFileDrop"
              :class="{ 'drag-over': dragOver, 'has-image': form.imageUrl }"
            >
              <div v-if="imageUploading" class="upload-progress">
                <div class="spinner"></div>
                <p>Uploading to our cloud servers...</p>
              </div>
              <div v-else-if="form.imageUrl" class="uploaded-image-preview">
                <img :src="form.imageUrl" alt="Cover upload" />
                <button @click.prevent="removeImage" class="btn btn-danger remove-img-btn">Delete Image</button>
              </div>
              <div v-else class="upload-placeholder">
                <span class="upload-icon">📷</span>
                <p>Drag and drop a cover image here, or <span class="browse-link" @click="triggerFileInput">browse files</span></p>
                <span class="upload-sub">Supports JPG, PNG, GIF, WEBP up to 5MB</span>
                <input 
                  type="file" 
                  ref="fileInputRef" 
                  @change="handleFileSelect" 
                  accept="image/*" 
                  class="hidden-file-input"
                />
              </div>
            </div>
          </div>

          <!-- Summary Input -->
          <div class="form-group">
            <label class="form-label" for="summary">Article Abstract / Summary</label>
            <textarea 
              id="summary" 
              v-model="form.summary" 
              class="form-textarea summary-textarea" 
              placeholder="Provide a brief summary of the article (or use our AI Summary assistant on the right!)..."
              rows="3"
            ></textarea>
          </div>

          <!-- Content Editor -->
          <div class="form-group">
            <label class="form-label" for="content">Article Content</label>
            <textarea 
              id="content" 
              v-model="form.content" 
              class="form-textarea content-textarea" 
              placeholder="Write your cosmic thoughts here... (supports paragraphs and line spacing)"
              rows="12"
              required
            ></textarea>
          </div>

          <!-- Save / Publish Row -->
          <div class="editor-actions">
            <div class="status-toggle">
              <span class="toggle-label">Publish immediately?</span>
              <button 
                type="button"
                @click="form.blogStatus = form.blogStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'"
                :class="['toggle-btn', { active: form.blogStatus === 'PUBLISHED' }]"
              >
                <span>{{ form.blogStatus }}</span>
                <span class="toggle-switch"></span>
              </button>
            </div>

            <div class="action-buttons">
              <button type="button" @click="goBack" class="btn btn-secondary">Cancel</button>
              <button type="submit" :disabled="saving" class="btn btn-primary">
                <span v-if="saving" class="spinner btn-spinner"></span>
                <span v-else>{{ isEditMode ? 'Update Article' : 'Save Article' }}</span>
              </button>
            </div>
          </div>
        </form>
      </main>

      <!-- Right Panel: Gemini AI Writing Assistant -->
      <aside class="editor-sidebar">
        <div class="ai-assistant-card glass-card">
          <div class="ai-header">
            <span class="ai-stars">✨</span>
            <h3 class="ai-title">Gemini <span class="text-gradient">AI Assistant</span></h3>
          </div>
          <p class="ai-sub">Boost your writing quality, outline summaries, and generate metadata instantly.</p>

          <!-- AI Toolkit Panel -->
          <div class="ai-tools">
            <!-- Tool Item: Title Helper -->
            <div class="ai-tool-item">
              <button @click="generateAiTitles" :disabled="aiLoading || !form.content" class="btn btn-secondary w-full ai-btn">
                <span>💡 Hook & Title Suggestions</span>
              </button>
            </div>

            <!-- Tool Item: Summary Helper -->
            <div class="ai-tool-item">
              <button @click="generateAiSummary" :disabled="aiLoading || !form.content" class="btn btn-secondary w-full ai-btn">
                <span>📝 Generate 3-Line Summary</span>
              </button>
            </div>

            <!-- Tool Item: Tags Helper -->
            <div class="ai-tool-item">
              <button @click="generateAiTags" :disabled="aiLoading || !form.content" class="btn btn-secondary w-full ai-btn">
                <span>🏷️ SEO Tag Generator</span>
              </button>
            </div>

            <!-- Tool Item: Polish/Grammar -->
            <div class="ai-tool-item">
              <button @click="polishGrammar" :disabled="aiLoading || !form.content" class="btn btn-secondary w-full ai-btn">
                <span>✨ Spell & Grammar Polish</span>
              </button>
            </div>

            <!-- Tool Item: Continuation -->
            <div class="ai-tool-item">
              <button @click="suggestContinuation" :disabled="aiLoading || !form.content" class="btn btn-secondary w-full ai-btn">
                <span>🌌 Suggest Content continuation</span>
              </button>
            </div>
          </div>

          <!-- AI Status / Result Block -->
          <div v-if="aiLoading || aiResult" class="ai-result-box glass">
            <div v-if="aiLoading" class="ai-loading-state">
              <div class="spinner"></div>
              <p>Consulting Gemini space model...</p>
            </div>
            
            <div v-else-if="aiResult" class="ai-response-content">
              <div class="ai-result-header">
                <span class="result-label">{{ aiResultTitle }}</span>
                <button @click="clearAiResult" class="close-result-btn">✕</button>
              </div>

              <!-- List of title recommendations -->
              <div v-if="aiResultType === 'titles'" class="titles-selection-list">
                <p class="select-hint">Click a suggestion to replace your current title:</p>
                <button 
                  v-for="(title, idx) in parsedTitles" 
                  :key="idx"
                  @click="applyTitle(title)"
                  class="title-select-option"
                >
                  {{ title }}
                </button>
              </div>

              <!-- Plain result text -->
              <p v-else class="result-text-body">{{ aiResult }}</p>

              <!-- Apply Buttons -->
              <div class="ai-apply-footer" v-if="showApplyButton">
                <button @click="applyAiChange" class="btn btn-primary btn-sm">
                  Apply to Editor
                </button>
              </div>
            </div>
          </div>
          
          <p v-else class="content-warning-label" v-if="!form.content">
            ⚠️ Write some content in the editor to activate AI assistant tools.
          </p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api, type BlogStatus } from '@/services/api'

const router = useRouter()
const route = useRoute()

const blogId = route.params.id as string
const isEditMode = computed(() => !!blogId)

const categories = ['Technology', 'AI', 'Coding', 'Design', 'Lifestyle', 'Business', 'Travel', 'Science']

const initLoading = ref(false)
const saving = ref(false)
const dragOver = ref(false)
const imageUploading = ref(false)
const tagInput = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// Form Reactive State
const form = reactive({
  title: '',
  content: '',
  summary: '',
  category: 'Technology',
  tags: [] as string[],
  imageUrl: '',
  blogStatus: 'DRAFT' as BlogStatus
})

// AI Panel Reactive State
const aiLoading = ref(false)
const aiResult = ref('')
const aiResultTitle = ref('')
const aiResultType = ref<'summary' | 'titles' | 'tags' | 'grammar' | 'suggestions' | ''>('')

const loadBlogForEdit = async () => {
  if (!isEditMode.value) return
  initLoading.value = true
  try {
    const res = await api.blogs.getById(blogId)
    form.title = res.title
    form.content = res.content
    form.summary = res.summary || ''
    form.category = res.category || 'Technology'
    form.tags = res.tags || []
    form.imageUrl = res.imageUrl || ''
    form.blogStatus = res.status
  } catch (err) {
    console.error('Failed to load blog for editing:', err)
    alert('Failed to load article details.')
    router.push('/dashboard')
  } finally {
    initLoading.value = false
  }
}

onMounted(() => {
  loadBlogForEdit()
})

// Tags Manager
const addTag = () => {
  const clean = tagInput.value.trim().toLowerCase().replace(/#/g, '')
  if (clean && !form.tags.includes(clean)) {
    form.tags.push(clean)
  }
  tagInput.value = ''
}

const removeTag = (index: number) => {
  form.tags.splice(index, 1)
}

// Cover image upload managers
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    uploadImage(target.files[0])
  }
}

const handleFileDrop = (e: DragEvent) => {
  dragOver.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    uploadImage(e.dataTransfer.files[0])
  }
}

const uploadImage = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    alert('Please upload image files only.')
    return
  }
  imageUploading.value = true
  try {
    const res = await api.files.upload(file)
    form.imageUrl = res.url
  } catch (err: any) {
    alert(err.message || 'Image upload failed.')
  } finally {
    imageUploading.value = false
  }
}

const removeImage = () => {
  form.imageUrl = ''
}

// Submit managers
const saveBlog = async () => {
  saving.value = true
  try {
    if (isEditMode.value) {
      await api.blogs.update(blogId, form)
    } else {
      await api.blogs.create(form)
    }
    router.push('/dashboard')
  } catch (err: any) {
    alert(err.message || 'Saving blog failed.')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.back()
}

// AI Assistants Features
const clearAiResult = () => {
  aiResult.value = ''
  aiResultTitle.value = ''
  aiResultType.value = ''
}

const generateAiSummary = async () => {
  if (!form.content) return
  aiLoading.value = true
  clearAiResult()
  try {
    const res = await api.ai.getSummary(form.content)
    aiResult.value = res.result
    aiResultTitle.value = '📝 Gemini Suggested Abstract'
    aiResultType.value = 'summary'
  } catch (_) {
    aiResult.value = 'Failed to generate summary.'
  } finally {
    aiLoading.value = false
  }
}

const generateAiTitles = async () => {
  if (!form.content) return
  aiLoading.value = true
  clearAiResult()
  try {
    const res = await api.ai.getTitles(form.content)
    aiResult.value = res.result
    aiResultTitle.value = '💡 Catchy Blog Headlines'
    aiResultType.value = 'titles'
  } catch (_) {
    aiResult.value = 'Failed to generate titles.'
  } finally {
    aiLoading.value = false
  }
}

const generateAiTags = async () => {
  if (!form.content) return
  aiLoading.value = true
  clearAiResult()
  try {
    const res = await api.ai.getTags(form.content)
    aiResult.value = res.result
    aiResultTitle.value = '🏷️ Recommended SEO Tags'
    aiResultType.value = 'tags'
  } catch (_) {
    aiResult.value = 'Failed to generate tags.'
  } finally {
    aiLoading.value = false
  }
}

const polishGrammar = async () => {
  if (!form.content) return
  aiLoading.value = true
  clearAiResult()
  try {
    const res = await api.ai.fixGrammar(form.content)
    aiResult.value = res.result
    aiResultTitle.value = '✨ Polished Draft Proof'
    aiResultType.value = 'grammar'
  } catch (_) {
    aiResult.value = 'Failed to fix grammar.'
  } finally {
    aiLoading.value = false
  }
}

const suggestContinuation = async () => {
  if (!form.content) return
  aiLoading.value = true
  clearAiResult()
  try {
    const res = await api.ai.getSuggestions(form.content)
    aiResult.value = res.result
    aiResultTitle.value = '🌌 Ideas to Continue Writing'
    aiResultType.value = 'suggestions'
  } catch (_) {
    aiResult.value = 'Failed to generate continuation.'
  } finally {
    aiLoading.value = false
  }
}

// Parsing title helpers
const parsedTitles = computed(() => {
  if (aiResultType.value !== 'titles' || !aiResult.value) return []
  // Split titles by newlines and clean list indicators (1., 2., -, etc.)
  return aiResult.value
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*|^\-\s*/g, '').trim())
    .filter(line => line.length > 0)
})

const applyTitle = (title: string) => {
  form.title = title.replace(/"/g, '') // remove quote characters
  clearAiResult()
}

// General apply actions
const showApplyButton = computed(() => {
  return ['summary', 'grammar', 'suggestions', 'tags'].includes(aiResultType.value)
})

const applyAiChange = () => {
  if (aiResultType.value === 'summary') {
    form.summary = aiResult.value
  } else if (aiResultType.value === 'grammar') {
    form.content = aiResult.value
  } else if (aiResultType.value === 'suggestions') {
    form.content += '\n\n' + aiResult.value
  } else if (aiResultType.value === 'tags') {
    // Parse tags from comma separated values
    const list = aiResult.value
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/#/g, ''))
      .filter(t => t.length > 0)
    
    list.forEach(tag => {
      if (!form.tags.includes(tag)) {
        form.tags.push(tag)
      }
    })
  }
  clearAiResult()
}
</script>

<style scoped>
.editor-page {
  max-width: 1250px;
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

.editor-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 30px;
  align-items: start;
}

.editor-main {
  padding: 32px;
  border-radius: 24px;
  text-align: left;
}

.editor-heading {
  font-size: 1.8rem;
  margin-bottom: 24px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.editor-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.title-input {
  font-size: 1.25rem;
  font-weight: 700;
}

.form-row {
  display: flex;
  gap: 20px;
}

.flex-1 {
  flex: 1;
}

/* Tag chips management */
.tag-input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-purple);
  background: rgba(139, 92, 246, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.remove-tag-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
}

.remove-tag-btn:hover {
  color: var(--accent-red);
}

/* Image Upload Area */
.image-upload-zone {
  width: 100%;
  height: 200px;
  border: 2px dashed var(--border);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: var(--transition-fast);
}

.image-upload-zone.drag-over {
  border-color: var(--accent-purple);
  background: rgba(139, 92, 246, 0.05);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  padding: 20px;
}

.upload-icon {
  font-size: 2.2rem;
}

.browse-link {
  color: var(--accent-purple);
  font-weight: 600;
  text-decoration: underline;
}

.upload-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.hidden-file-input {
  display: none;
}

.uploaded-image-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.uploaded-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-img-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  box-shadow: var(--shadow-md);
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

/* Textareas custom sizes */
.summary-textarea {
  min-height: 80px;
}

.content-textarea {
  min-height: 250px;
  font-family: inherit;
}

/* Status toggler */
.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  padding-top: 24px;
  margin-top: 16px;
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-label {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 99px;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition-fast);
  position: relative;
}

.toggle-switch {
  width: 12px;
  height: 12px;
  background: var(--text-muted);
  border-radius: 50%;
  transition: var(--transition-fast);
}

.toggle-btn.active {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.3);
}

.toggle-btn.active .toggle-switch {
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-spinner {
  width: 18px;
  height: 18px;
}

/* AI Sidebar assistant card */
.editor-sidebar {
  display: flex;
  flex-direction: column;
}

.ai-assistant-card {
  padding: 24px;
  border-radius: 20px;
  text-align: left;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.ai-stars {
  font-size: 1.3rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

.ai-title {
  font-size: 1.25rem;
}

.ai-sub {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.4;
}

.ai-tools {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.ai-btn {
  text-align: left;
  justify-content: flex-start;
  padding: 12px 16px;
  font-size: 0.9rem;
}

.ai-btn:hover:not(:disabled) {
  border-color: var(--accent-purple);
  background: rgba(139, 92, 246, 0.05);
}

.ai-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content-warning-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px dashed var(--border);
}

/* AI Output Response panel */
.ai-result-box {
  padding: 16px;
  border-radius: 14px;
  margin-top: 16px;
  background: rgba(139, 92, 246, 0.03);
  border: 1px solid rgba(139, 92, 246, 0.15);
}

.ai-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  gap: 12px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.ai-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 8px;
}

.result-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-primary);
}

.close-result-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.85rem;
}

.close-result-btn:hover {
  color: var(--text-primary);
}

.result-text-body {
  font-size: 0.9rem;
  color: #d1d5db;
  line-height: 1.5;
  white-space: pre-wrap;
}

.ai-apply-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 0.8rem;
  border-radius: 8px;
}

/* AI Title selector styling */
.titles-selection-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.title-select-option {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  transition: var(--transition-fast);
}

.title-select-option:hover {
  border-color: var(--accent-purple);
  background: rgba(139, 92, 246, 0.06);
  color: #c084fc;
}

@media (max-width: 900px) {
  .editor-grid {
    grid-template-columns: 1fr;
  }
  .form-row {
    flex-direction: column;
  }
  .editor-main {
    padding: 20px;
  }
}
</style>
