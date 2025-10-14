import { useAuthStore } from '../../stores/authStore'
import { Button } from '../ui/button'

interface CollectorHeaderProps {
  user: any
}

export default function CollectorHeader({ user }: CollectorHeaderProps) {
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome, {user?.name}
            </h2>
            <p className="text-sm text-gray-500">
              {user?.role} • {user?.zone}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500">
                Ready for collection
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
