import { useEffect, useState } from 'react'
import { useUserStore } from '../../stores/userStore'
import { USER_ROLES, ZONES } from '../../constants'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function UserManagement () {
  const {
    users,
    userStats,
    isLoading,
    pagination,
    filters,
    fetchUsers,
    fetchUserStats,
    changeUserRole,
    disableUser,
    activateUser,
    removeUser,
    setFilters,
    resetFilters
  } = useUserStore()

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [newRole, setNewRole] = useState('')

  useEffect(() => {
    fetchUsers()
    fetchUserStats()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [filters, pagination.page])

  const handleRoleChange = async () => {
    if (selectedUser && newRole) {
      await changeUserRole(selectedUser._id, newRole)
      setShowRoleModal(false)
      setSelectedUser(null)
      setNewRole('')
    }
  }

  const handleStatusToggle = async (user: any) => {
    if (user.isActive) {
      await disableUser(user._id)
    } else {
      await activateUser(user._id)
    }
  }

  const handleRemoveUser = async (user: any) => {
    if (window.confirm(`Are you sure you want to remove ${user.name}?`)) {
      await removeUser(user._id)
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {isActive ? 'Active' : 'Inactive'}
      </span>
    )
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      RESIDENT: 'bg-blue-100 text-blue-800',
      BUSINESS: 'bg-green-100 text-green-800',
      COLLECTOR: 'bg-orange-100 text-orange-800',
      DRIVER: 'bg-yellow-100 text-yellow-800'
    }

    return (
      <span
        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          colors[role] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {role}
      </span>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>User Management</h1>
        <p className='text-gray-600'>Manage system users and permissions</p>
      </div>

      {/* Stats Cards */}
      {userStats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
            <div className='flex items-center'>
              <div className='text-xl mr-2'>👥</div>
              <div>
                <p className='text-xs font-medium text-gray-600'>Total Users</p>
                <p className='text-xl font-bold text-gray-900'>
                  {userStats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
            <div className='flex items-center'>
              <div className='text-xl mr-2'>✅</div>
              <div>
                <p className='text-xs font-medium text-gray-600'>
                  Active Users
                </p>
                <p className='text-xl font-bold text-gray-900'>
                  {userStats.activeUsers}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
            <div className='flex items-center'>
              <div className='text-xl mr-2'>❌</div>
              <div>
                <p className='text-xs font-medium text-gray-600'>
                  Inactive Users
                </p>
                <p className='text-xl font-bold text-gray-900'>
                  {userStats.inactiveUsers}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
            <div className='flex items-center'>
              <div className='text-xl mr-2'>📊</div>
              <div>
                <p className='text-xs font-medium text-gray-600'>Roles</p>
                <p className='text-xl font-bold text-gray-900'>
                  {userStats.roleStats.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className='bg-white p-3 rounded-lg shadow-sm border border-gray-200'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-sm font-semibold text-gray-900'>Filters</h2>
        </div>

        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Label htmlFor='search' className='text-sm whitespace-nowrap'>
              Search
            </Label>
            <Input
              id='search'
              placeholder='Name or email'
              value={filters.search}
              onChange={e => setFilters({ search: e.target.value })}
              className='h-9 w-48'
            />
          </div>

          <div className='flex items-center gap-2'>
            <Label htmlFor='role' className='text-sm whitespace-nowrap'>
              Role
            </Label>
            <Select
              value={filters.role || 'ALL'}
              onValueChange={value =>
                setFilters({ role: value === 'ALL' ? '' : value })
              }
            >
              <SelectTrigger className='h-9 w-36'>
                <SelectValue placeholder='All roles' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All roles</SelectItem>
                {USER_ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center gap-2'>
            <Label htmlFor='status' className='text-sm whitespace-nowrap'>
              Status
            </Label>
            <Select
              value={filters.status || 'ALL'}
              onValueChange={value =>
                setFilters({ status: value === 'ALL' ? '' : value })
              }
            >
              <SelectTrigger className='h-9 w-36'>
                <SelectValue placeholder='All statuses' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All statuses</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center gap-2'>
            <Label htmlFor='zone' className='text-sm whitespace-nowrap'>
              Zone
            </Label>
            <Select
              value={filters.zone || 'ALL'}
              onValueChange={value =>
                setFilters({ zone: value === 'ALL' ? '' : value })
              }
            >
              <SelectTrigger className='h-9 w-36'>
                <SelectValue placeholder='All zones' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>All zones</SelectItem>
                {ZONES.map(zone => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='ml-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={resetFilters}
              className='h-7 text-xs px-2'
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>Users</h2>
        </div>

        {isLoading ? (
          <div className='p-8 text-center'>
            <LoadingSpinner size='lg' />
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    User
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Role
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Zone
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Joined
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {users.map(user => (
                  <tr key={user._id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {user.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {getRoleBadge(user.role)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {user.zone}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setSelectedUser(user)
                          setNewRole(user.role)
                          setShowRoleModal(true)
                        }}
                      >
                        Change Role
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleStatusToggle(user)}
                        className={
                          user.isActive ? 'text-red-600' : 'text-green-600'
                        }
                      >
                        {user.isActive ? 'Disable' : 'Activate'}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleRemoveUser(user)}
                        className='text-red-600'
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
            <div className='text-sm text-gray-700'>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} results
            </div>
            <div className='flex space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => fetchUsers({ page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => fetchUsers({ page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg max-w-md w-full'>
            <h3 className='text-lg font-semibold text-gray-900 mb-4'>
              Change User Role
            </h3>
            <p className='text-sm text-gray-600 mb-4'>
              Change role for <strong>{selectedUser?.name}</strong>
            </p>

            <div className='mb-4'>
              <Label htmlFor='role'>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='flex space-x-3'>
              <Button
                onClick={handleRoleChange}
                disabled={!newRole || newRole === selectedUser?.role}
              >
                Change Role
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  setShowRoleModal(false)
                  setSelectedUser(null)
                  setNewRole('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
