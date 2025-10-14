import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'RESIDENT' | 'BUSINESS' | 'COLLECTOR' | 'DRIVER'
  phone: string
  address: string
  zone: string
  rewardsBalance: number
  lastLoginAt?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (userData: Partial<User>) => void
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone: string
  address: string
  zone: string
  role?: string
}

// Set up axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
axios.defaults.withCredentials = true

// Add request interceptor to include token
axios.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      toast.error('Session expired. Please login again.')
    }
    return Promise.reject(error)
  }
)

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await axios.post('/auth/login', { email, password })
          const { user, token } = response.data
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          })
          
          toast.success(`Welcome back, ${user.name}!`)
        } catch (error: any) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Login failed'
          toast.error(message)
          throw error
        }
      },

      register: async (userData: RegisterData) => {
        set({ isLoading: true })
        try {
          await axios.post('/auth/register', userData)
          
          set({ isLoading: false })
          toast.success('Registration successful! Please login.')
        } catch (error: any) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          throw error
        }
      },

      logout: async () => {
        try {
          await axios.post('/auth/logout')
        } catch (error) {
          // Ignore logout errors
        }
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
        
        toast.success('Logged out successfully')
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const response = await axios.get('/auth/me')
          const { user } = response.data
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({
            user: { ...user, ...userData }
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

// Check auth on app start
useAuthStore.getState().checkAuth()
