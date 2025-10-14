export default function CollectorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collector Dashboard</h1>
        <p className="text-gray-600">Manage your collection routes and activities</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🗺️</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📦</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Collections Today</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚖️</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="text-2xl font-bold text-gray-900">245 kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Routes */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Routes</h2>
        <div className="space-y-3">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Zone A Collection</h3>
                <p className="text-sm text-gray-500">15 stops • 2.5 hours estimated</p>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                In Progress
              </span>
            </div>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Zone B Collection</h3>
                <p className="text-sm text-gray-500">8 stops • 1.5 hours estimated</p>
              </div>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Scheduled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
