import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import CollectorHeader from '../../components/collector/CollectorHeader'
import CollectorSidebar from '../../components/collector/CollectorSidebar'
import CollectorDashboard from '../../components/collector/CollectorDashboard'
import MyRoutes from '../../components/collector/MyRoutes'
import CollectionBins from '../../components/collector/CollectionBins'
import CollectionTracking from '../../components/collector/CollectionTracking'

export default function CollectorHome() {
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <CollectorSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <CollectorHeader user={user} />
          
          <main className="flex-1 p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/collector/dashboard" replace />} />
              <Route path="/dashboard" element={<CollectorDashboard />} />
              <Route path="/routes" element={<MyRoutes />} />
              <Route path="/tracking" element={<CollectionTracking />} />
              <Route path="/bins" element={<CollectionBins />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}