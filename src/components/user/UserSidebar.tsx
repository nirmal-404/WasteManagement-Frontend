import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/user/dashboard', icon: '🏠' },
  { name: 'My Requests', href: '/user/requests', icon: '📝' },
  { name: 'New Request', href: '/user/requests/new', icon: '➕' },
  { name: 'Waste Records', href: '/user/waste-records', icon: '🧾' },
  { name: 'Bills & Payments', href: '/user/payments', icon: '💳' },
  { name: 'Bins', href: '/user/bins', icon: '🗑️' },
  { name: 'Payment Gateway', href: '/user/payment-gateway', icon: '💰' },
]

export default function UserSidebar() {
  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SW</span>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Waste Management</h1>
            <p className="text-xs text-gray-500">User Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        <div className="px-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1',
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4">
        <div className="bg-gray-100 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            Smart Waste Management System v1.0
          </p>
        </div>
      </div>
    </div>
  )
}
