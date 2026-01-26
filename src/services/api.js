import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      useAuthStore.getState().logout()
      window.location.href = '/users/login'
    }
    // Check for banned account or role change (403 with specific error message)
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.error || ''
      const errorData = error.response?.data || {}
      
      if (errorMessage === 'Account has been banned' || errorMessage.includes('banned')) {
        // User has been banned, logout and show message
        useAuthStore.getState().logout()
        toast.error('Your account has been banned. Please contact admin.')
        setTimeout(() => {
          window.location.href = '/users/login'
        }, 1000)
        return Promise.reject(error)
      }
      
      if (errorMessage === 'User role has changed' || errorData.message?.includes('role has been changed')) {
        // User role has been changed (promoted/demoted), logout and show message
        useAuthStore.getState().logout()
        toast.error('Your account role has been changed. Please log in again.')
        setTimeout(() => {
          window.location.href = '/users/login'
        }, 1000)
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  verifyEmail: (email, token) => api.post('/auth/verify-email', { email, token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
}

// User API
export const userAPI = {
  getAll: (page = 1, perPage = 20) => api.get(`/users?page=${page}&per_page=${perPage}`),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  updateProfileImage: (id, profileImageUrl) => api.put(`/users/${id}/profile-image`, { profileImageUrl }),
  ban: (id) => api.put(`/users/${id}/ban`),
  unban: (id) => api.put(`/users/${id}/unban`),
  promote: (id) => api.put(`/users/${id}/promote`),
  demote: (id) => api.put(`/users/${id}/demote`),
  delete: (id) => api.delete(`/users/${id}`),
}

// Post API
export const postAPI = {
  getAll: (params = {}) => api.get('/posts', { params }),
  getDrafts: () => api.get('/posts/drafts'),
  getBanned: (params = {}) => api.get('/posts/banned', { params }),
  getDeleted: (params = {}) => api.get('/posts/deleted', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.put(`/posts/${id}`, data),
  updateStatus: (id, status) => api.put(`/posts/${id}/status`, { status }),
  archive: (id) => api.put(`/posts/${id}/archive`),
  ban: (id) => api.put(`/posts/${id}/ban`),
  unban: (id) => api.put(`/posts/${id}/unban`),
  recover: (id) => api.put(`/posts/${id}/recover`),
  delete: (id) => api.delete(`/posts/${id}`),
  getUserTopPosts: (userId) => api.get(`/users/${userId}/top-posts`),
}

// Reply API
export const replyAPI = {
  getByPost: (postId, params = {}) => api.get(`/posts/${postId}/replies`, { params }),
  create: (postId, comment, attachments = []) => api.post(`/posts/${postId}/replies`, { comment, attachments }),
  createSubReply: (replyId, comment, attachments = [], postId, parentReplyId, targetPath) => api.post(`/replies/${replyId}/sub`, { comment, attachments, postId, parentReplyId, targetPath }),
  delete: (id) => api.delete(`/replies/${id}`),
  deleteNested: (parentReplyId, targetPath) => api.delete(`/replies/${parentReplyId}/nested`, { data: { targetPath } }),
}

// History API
export const historyAPI = {
  record: (postId) => api.post('/history', { postId }),
  getUserHistory: (userId, params = {}) => api.get(`/users/${userId}/history`, { params }),
  search: (userId, params = {}) => api.get(`/users/${userId}/history/search`, { params }),
}

// Message API
export const messageAPI = {
  create: (data) => api.post('/messages', data),
  getAll: (params = {}) => api.get('/messages', { params }),
  updateStatus: (id, status) => api.put(`/messages/${id}/status`, { status }),
}

// File API
export const fileAPI = {
  upload: (file, type = 'general') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getPresignedUrl: (key) => api.get(`/files/${key}`),
  delete: (key) => api.delete(`/files/${key}`),
}

export default api
