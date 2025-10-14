import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Sidebar from '../../components/admin/Sidebar'
import Header from '../../components/admin/Header'
import DashboardHome from '../../components/admin/DashboardHome'
import RequestManagement from '../../components/admin/RequestManagement'
import PaymentManagement from '../../components/admin/PaymentManagement'
import RouteManagement from '../../components/admin/RouteManagement'
import UserManagement from '../../components/admin/UserManagement'
import Reports from '../../components/admin/Reports'

export default function AdminDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header user={user} />
          
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route path="/requests" element={<RequestManagement />} />
              <Route path="/payments" element={<PaymentManagement />} />
              <Route path="/routes" element={<RouteManagement />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}