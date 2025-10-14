import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/button'

export default function UnauthorizedPage() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Unauthorized Access</h2>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. 
          {user && (
            <span className="block mt-2">
              Your role: <span className="font-medium">{user.role}</span>
            </span>
          )}
        </p>
        <div className="space-x-4">
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
          <Button onClick={() => useAuthStore.getState().logout()}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}