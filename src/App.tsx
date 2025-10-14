import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'

// Pages
import Login from './pages/auth/login'
import Register from './pages/auth/register'
import AdminDashboard from './pages/admin/dashboard'
import UserHome from './pages/user/home'
import CollectorHome from './pages/collector/home'
import NotFound from './pages/not-found'
import UnauthorizedPage from './pages/unauth-page'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoadingSpinner from './components/ui/LoadingSpinner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to={getDefaultRoute(user.role)} replace /> : <Register />} 
            />
            
            {/* Protected Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/user/*" element={
              <ProtectedRoute allowedRoles={['RESIDENT', 'BUSINESS']}>
                <UserHome />
              </ProtectedRoute>
            } />
            
            <Route path="/collector/*" element={
              <ProtectedRoute allowedRoles={['COLLECTOR', 'DRIVER']}>
                <CollectorHome />
              </ProtectedRoute>
            } />
            
            {/* Default Route */}
            <Route 
              path="/" 
              element={
                user ? 
                  <Navigate to={getDefaultRoute(user.role)} replace /> : 
                  <Navigate to="/login" replace />
              } 
            />
            
            {/* Error Routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

// Helper function to get default route based on user role
function getDefaultRoute(role: string): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'RESIDENT':
    case 'BUSINESS':
      return '/user'
    case 'COLLECTOR':
    case 'DRIVER':
      return '/collector'
    default:
      return '/login'
  }
}

export default App
