import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import UserHeader from '../../components/user/UserHeader'
import UserSidebar from '../../components/user/UserSidebar'
import UserDashboard from '../../components/user/UserDashboard'
import MyRequests from '../../components/user/MyRequests'
import MyPayments from '../../components/user/MyPayments'
import NewRequest from '../../components/user/NewRequest'
import MyBins from '../../components/user/MyBin_Assign'

export default function UserHome() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <UserSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <UserHeader user={user} />
          
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/user/dashboard" replace />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/requests" element={<MyRequests />} />
              <Route path="/requests/new" element={<NewRequest />} />
              <Route path="/payments" element={<MyPayments />} />
              <Route path="/bins" element={<MyBins />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}
