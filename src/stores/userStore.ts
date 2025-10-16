import { create } from 'zustand'
import axios from 'axios'
import toast from 'react-hot-toast'

interface User {
  _id: string
  name: string
  email: string
  role: 'ADMIN' | 'RESIDENT' | 'BUSINESS' | 'COLLECTOR' | 'DRIVER'
  phone: string
  address: string
  zone: string
  rewardsBalance: number
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  roleStats: Array<{
    _id: string
    count: number
    active: number
  }>
}

interface UserState {
  users: User[]
  userStats: UserStats | null
  isLoading: boolean
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    role: string
    status: string
    zone: string
    search: string
  }
}

interface UserActions {
  fetchUsers: (params?: any) => Promise<void>
  fetchUserStats: () => Promise<void>
  changeUserRole: (userId: string, role: string) => Promise<void>
  disableUser: (userId: string) => Promise<void>
  activateUser: (userId: string) => Promise<void>
  removeUser: (userId: string) => Promise<void>
  setFilters: (filters: Partial<UserState['filters']>) => void
  resetFilters: () => void
}

const initialState: UserState = {
  users: [],
  userStats: null,
  isLoading: false,
  pagination: {
    page: 1,
    limit: 5,
    total: 0,
    pages: 0
  },
  filters: {
    role: '',
    status: '',
    zone: '',
    search: ''
  }
}

export const useUserStore = create<UserState & UserActions>((set, get) => ({
  ...initialState,

  fetchUsers: async (params = {}) => {
    set({ isLoading: true })
    try {
      const { filters, pagination } = get()
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params
      }

      // Remove empty filters
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null) {
          delete queryParams[key]
        }
      })

      const response = await axios.get('/users', { params: queryParams })
      const { users, pagination: paginationData } = response.data

      set({
        users,
        pagination: paginationData,
        isLoading: false
      })
    } catch (error: any) {
      set({ isLoading: false })
      const message = error.response?.data?.message || 'Failed to fetch users'
      toast.error(message)
      throw error
    }
  },

  fetchUserStats: async () => {
    try {
      const response = await axios.get('/users/stats')
      set({ userStats: response.data })
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch user statistics'
      toast.error(message)
      throw error
    }
  },

  changeUserRole: async (userId: string, role: string) => {
    try {
      await axios.patch(`/users/change-role/${userId}`, { role })
      
      // Update the user in the local state
      set(state => ({
        users: state.users.map(user => 
          user._id === userId ? { ...user, role } : user
        )
      }))
      
      toast.success('User role updated successfully')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to change user role'
      toast.error(message)
      throw error
    }
  },

  disableUser: async (userId: string) => {
    try {
      await axios.patch(`/users/disable/${userId}`)
      
      // Update the user in the local state
      set(state => ({
        users: state.users.map(user => 
          user._id === userId ? { ...user, isActive: false } : user
        )
      }))
      
      toast.success('User disabled successfully')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to disable user'
      toast.error(message)
      throw error
    }
  },

  activateUser: async (userId: string) => {
    try {
      await axios.patch(`/users/activate/${userId}`)
      
      // Update the user in the local state
      set(state => ({
        users: state.users.map(user => 
          user._id === userId ? { ...user, isActive: true } : user
        )
      }))
      
      toast.success('User activated successfully')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to activate user'
      toast.error(message)
      throw error
    }
  },

  removeUser: async (userId: string) => {
    try {
      await axios.delete(`/users/${userId}`)
      
      // Remove the user from the local state
      set(state => ({
        users: state.users.filter(user => user._id !== userId),
        pagination: {
          ...state.pagination,
          total: state.pagination.total - 1
        }
      }))
      
      toast.success('User removed successfully')
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove user'
      toast.error(message)
      throw error
    }
  },

  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 } // Reset to first page when filters change
    }))
  },

  resetFilters: () => {
    set({ filters: initialState.filters, pagination: { ...get().pagination, page: 1 } })
  }
}))
