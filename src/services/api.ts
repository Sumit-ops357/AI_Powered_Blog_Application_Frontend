import { authStore } from '@/store/auth'

export type BlogStatus = 'DRAFT' | 'PUBLISHED'

export interface UserProfile {
  id: string
  name: string
  email: string
  bio?: string
  avatarUrl?: string
  following: string[]
  createdAt: string
}

export interface Blog {
  id: string
  authorId: string
  title: string
  content: string
  summary?: string
  category?: string
  tags: string[]
  imageUrl?: string
  status: BlogStatus
  views: number
  likedBy: string[]
  bookmarkedBy: string[]
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  blogId: string
  authorId: string
  authorName: string
  message: string
  createdAt: string
}

export interface Analytics {
  totalBlogs: number
  totalViews: number
  totalLikes: number
  commentsWritten: number
  popularBlog: Blog | null
}

const BASE_URL = '' // handled by dev server proxy locally

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  
  // Auto-inject JWT token if user is authenticated
  if (authStore.isAuthenticated.value) {
    headers.set('Authorization', `Bearer ${authStore.token.value}`)
  }

  // Set Content-Type default to JSON if we aren't uploading files (FormData)
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    let errorMessage = 'Something went wrong'
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorMessage
    } catch (_) {
      try {
        errorMessage = await response.text() || errorMessage
      } catch (_) {}
    }
    throw new Error(errorMessage)
  }

  // Handle empty or 204 No Content responses safely
  if (response.status === 204) {
    return {} as T
  }

  // If response is text, try to return text
  const contentType = response.headers.get('content-type')
  if (contentType && !contentType.includes('application/json')) {
    return (await response.text()) as unknown as T
  }

  return response.json()
}

export const api = {
  // Authentication
  auth: {
    signup(name: string, email: string, password: string) {
      return request<{ token: string; userId: string; name: string; email: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      })
    },
    login(email: string, password: string) {
      return request<{ token: string; userId: string; name: string; email: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
    }
  },

  // Blogs Management
  blogs: {
    getAll(params?: { q?: string; category?: string; tag?: string; sort?: 'date' | 'popular' }) {
      const query = new URLSearchParams()
      if (params?.q) query.set('q', params.q)
      if (params?.category) query.set('category', params.category)
      if (params?.tag) query.set('tag', params.tag)
      if (params?.sort) query.set('sort', params.sort)
      
      const queryString = query.toString()
      return request<Blog[]>(`/api/blogs${queryString ? `?${queryString}` : ''}`)
    },
    getById(id: string) {
      return request<Blog>(`/api/blogs/${id}`)
    },
    getMine() {
      return request<Blog[]>('/api/blogs/mine')
    },
    create(data: {
      title: string
      content: string
      summary?: string
      category?: string
      tags: string[]
      imageUrl?: string
      blogStatus: BlogStatus
    }) {
      return request<Blog>('/api/blogs', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },
    update(id: string, data: {
      title: string
      content: string
      summary?: string
      category?: string
      tags: string[]
      imageUrl?: string
      blogStatus: BlogStatus
    }) {
      return request<Blog>(`/api/blogs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },
    delete(id: string) {
      return request<void>(`/api/blogs/${id}`, {
        method: 'DELETE'
      })
    }
  },

  // Comments Management
  comments: {
    getForBlog(blogId: string) {
      return request<Comment[]>(`/api/comments/${blogId}`)
    },
    add(blogId: string, message: string) {
      return request<Comment>(`/api/comments/${blogId}`, {
        method: 'POST',
        body: JSON.stringify({ message })
      })
    },
    delete(id: string) {
      return request<void>(`/api/comments/${id}`, {
        method: 'DELETE'
      })
    }
  },

  // Social Features
  social: {
    toggleLike(blogId: string) {
      return request<Blog>(`/api/social/blogs/${blogId}/like`, { method: 'POST' })
    },
    toggleBookmark(blogId: string) {
      return request<Blog>(`/api/social/blogs/${blogId}/bookmark`, { method: 'POST' })
    },
    toggleFollow(authorId: string) {
      return request<UserProfile>(`/api/social/authors/${authorId}/follow`, { method: 'POST' })
    },
    getProfile(id: string) {
      return request<UserProfile>(`/api/social/profiles/${id}`)
    }
  },

  // File Upload
  files: {
    upload(file: File) {
      const formData = new FormData()
      formData.append('file', file)
      return request<{ url: string }>('/api/files/upload', {
        method: 'POST',
        body: formData
      })
    }
  },

  // AI Assistant Endpoints
  ai: {
    getSummary(text: string) {
      return request<{ result: string }>('/api/ai/summary', {
        method: 'POST',
        body: JSON.stringify({ text })
      })
    },
    getTitles(text: string) {
      return request<{ result: string }>('/api/ai/titles', {
        method: 'POST',
        body: JSON.stringify({ text })
      })
    },
    getTags(text: string) {
      return request<{ result: string }>('/api/ai/tags', {
        method: 'POST',
        body: JSON.stringify({ text })
      })
    },
    fixGrammar(text: string) {
      return request<{ result: string }>('/api/ai/grammar', {
        method: 'POST',
        body: JSON.stringify({ text })
      })
    },
    getSuggestions(text: string) {
      return request<{ result: string }>('/api/ai/suggestions', {
        method: 'POST',
        body: JSON.stringify({ text })
      })
    }
  },

  // Personal Dashboard/Analytics
  analytics: {
    getMe() {
      return request<Analytics>('/api/analytics/me')
    }
  }
}
