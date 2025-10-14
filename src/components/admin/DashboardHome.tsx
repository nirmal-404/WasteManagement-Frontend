import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  totalPayments: number
  pendingPayments: number
  totalRoutes: number
  activeRoutes: number
  totalUsers: number
  activeUsers: number
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    totalPayments: 0,
    pendingPayments: 0,
    totalRoutes: 0,
    activeRoutes: 0,
    totalUsers: 0,
    activeUsers: 0
  })

  // Mock data for now - in real app, fetch from API
  useEffect(() => {
    // Simulate loading stats
    setTimeout(() => {
      setStats({
        totalRequests: 156,
        pendingRequests: 23,
        totalPayments: 89,
        pendingPayments: 12,
        totalRoutes: 45,
        activeRoutes: 8,
        totalUsers: 234,
        activeUsers: 189
      })
    }, 1000)
  }, [])

  const statCards = [
    {
      title: 'Total Requests',
      value: stats.totalRequests,
      change: '+12%',
      changeType: 'positive' as const,
      icon: '📝'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests,
      change: '+5%',
      changeType: 'neutral' as const,
      icon: '⏳'
    },
    {
      title: 'Total Payments',
      value: stats.totalPayments,
      change: '+18%',
      changeType: 'positive' as const,
      icon: '💳'
    },
    {
      title: 'Pending Payments',
      value: stats.pendingPayments,
      change: '-3%',
      changeType: 'negative' as const,
      icon: '💰'
    },
    {
      title: 'Total Routes',
      value: stats.totalRoutes,
      change: '+8%',
      changeType: 'positive' as const,
      icon: '🗺️'
    },
    {
      title: 'Active Routes',
      value: stats.activeRoutes,
      change: '+2%',
      changeType: 'positive' as const,
      icon: '🚛'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: '+15%',
      changeType: 'positive' as const,
      icon: '👥'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      change: '+22%',
      changeType: 'positive' as const,
      icon: '✅'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your waste management operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
            <div className="mt-4">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">from last month</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-medium text-gray-900">Review Requests</h3>
            <p className="text-sm text-gray-500">Manage pending collection requests</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">🗺️</div>
            <h3 className="font-medium text-gray-900">Plan Routes</h3>
            <p className="text-sm text-gray-500">Create optimized collection routes</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-medium text-gray-900">View Reports</h3>
            <p className="text-sm text-gray-500">Analyze system performance</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">New collection request submitted</p>
              <p className="text-xs text-gray-500">2 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Route completed successfully</p>
              <p className="text-xs text-gray-500">15 minutes ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Payment processed</p>
              <p className="text-xs text-gray-500">1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
