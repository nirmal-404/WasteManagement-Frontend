import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/button'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

interface UserHeaderProps {
  user: any
}

export default function UserHeader({ user }: UserHeaderProps) {
  const { logout } = useAuthStore()
  const [notifications, setNotifications] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [reward, setReward] = useState<any | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/my/notifications`, { credentials: 'include' })
        const data = await res.json()
        if (res.ok) setNotifications(data.notifications || [])
      } catch {}
    }
    const fetchReward = async () => {
      try {
        const res = await fetch(`${API_URL}/rewards/my`, { credentials: 'include' })
        const data = await res.json()
        if (res.ok) setReward(data.reward || null)
      } catch {}
    }
    fetchNotifications()
    fetchReward()
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const deleteNotification = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/my/notifications/${id}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) setNotifications(prev => prev.filter(n => n._id !== id))
    } catch {}
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Hello, {user?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {user?.role} • {user?.zone}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Reward summary */}
            <div className="hidden md:block text-right">
              <div className="text-xs text-gray-500">Rewards</div>
              <div className="text-sm font-medium text-gray-900">
                {reward?.points || 0} pts
              </div>
              {reward?.expiryDate && (
                <div className="text-[11px] text-gray-500">Exp: {new Date(reward.expiryDate).toLocaleDateString()}</div>
              )}
            </div>
            {/* Notifications */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setOpen(v => !v)} className="relative p-2 rounded-full hover:bg-gray-100">
                <span className="text-xl">🔔</span>
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] leading-3 px-1.5 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-3 border-b">
                    <div className="font-semibold text-gray-900">Notifications</div>
                    <div className="text-xs text-gray-500">Latest updates about your requests and payments</div>
                  </div>
                  <div className="max-h-80 overflow-auto divide-y">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No notifications</div>
                    ) : notifications.map(n => (
                      <div key={n._id} className="p-3 flex items-start gap-3">
                        <div className="text-lg mt-0.5">{n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '⛔' : 'ℹ️'}</div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">{n.message}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                        <button onClick={() => deleteNotification(n._id)} className="text-xs text-red-600 hover:underline">Delete</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                Reward Balance: {user?.rewardsBalance || 0} points
              </p>
              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
