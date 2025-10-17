import { useState, useEffect } from 'react'
import { Trash2, MapPin, Calendar, Weight, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function CollectionBins() {
  const [bins, setBins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchBins()
  }, [])

  const fetchBins = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/bins/`, {
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch collections')
      }

      setBins(data)
    } catch (err) {
      console.error('Fetch error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to fetch collections')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCollectBin = async (binId : any) => {
    setActionLoading(binId)
    setError('')
    setSuccessMessage('')
    try {
      const response = await fetch(`${API_URL}/bins/collect/${binId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to collect bin')
      }

      setSuccessMessage('Bin collected successfully!')
      await fetchBins()
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Collection error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to collect bin')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelBin = async (binId : any) => {
    setActionLoading(binId)
    setError('')
    setSuccessMessage('')
    try {
      const response = await fetch(`${API_URL}/bins/cancel/${binId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel collection')
      }

      setSuccessMessage('Collection cancelled successfully!')
      await fetchBins()
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Cancel error:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to cancel collection')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status : any) => {
    switch (status) {
      case 'Ready':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Collected':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getWasteTypeColor = (type : any) => {
    switch (type) {
      case 'Paper':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'Plastic':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'Glass':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200'
      case 'Metal':
        return 'bg-slate-50 text-slate-700 border-slate-200'
      case 'Organic':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getFillLevelColor = (level : any) => {
    if (level >= 80) return 'text-red-600'
    if (level >= 50) return 'text-orange-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading bins...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Trash2 className="text-blue-600" size={40} />
            Collection Bins
          </h1>
          <p className="text-slate-600 text-lg">Total bins: {bins.length}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg flex items-start gap-3">
            <CheckCircle className="text-green-500 mt-0.5" size={20} />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Bins Grid */}
        {bins.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Trash2 className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">No bins found</h3>
            <p className="text-slate-500">There are currently no bins to display.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bins.map((bin : any) => (
              <div
                key={bin._id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1 truncate">
                        {bin.locationName}
                      </h3>
                      <p className="text-blue-100 text-sm flex items-center gap-1">
                        <MapPin size={14} />
                        {bin.location.latitude.toFixed(4)}, {bin.location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bin.status)}`}>
                      {bin.status}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Waste Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm font-medium">Waste Type:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getWasteTypeColor(bin.wasteType)}`}>
                      {bin.wasteType}
                    </span>
                  </div>

                  {/* Fill Level */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-600 text-sm font-medium flex items-center gap-1">
                        <Activity size={14} />
                        Fill Level:
                      </span>
                      <span className={`font-bold ${getFillLevelColor(bin.fillLevel)}`}>
                        {bin.fillLevel}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          bin.fillLevel >= 80 ? 'bg-red-500' : bin.fillLevel >= 50 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${bin.fillLevel}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 text-sm font-medium flex items-center gap-1">
                      <Weight size={14} />
                      Weight:
                    </span>
                    <span className="font-semibold text-slate-800">{bin.weight} kg</span>
                  </div>

                  {/* User Info */}
                  {bin.userId && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">Reported by:</p>
                      <p className="text-sm font-medium text-slate-700">{bin.userId.name}</p>
                      <p className="text-xs text-slate-500">{bin.userId.email}</p>
                    </div>
                  )}

                  {/* Created Date */}
                  <div className="flex items-center gap-1 text-xs text-slate-500 pt-2">
                    <Calendar size={12} />
                    {new Date(bin.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
                  {bin.status === 'Ready' && (
                    <button
                      onClick={() => handleCollectBin(bin._id)}
                      disabled={actionLoading === bin._id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {actionLoading === bin._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Collect Bin
                        </>
                      )}
                    </button>
                  )}
                  {bin.status === 'Pending' && (
                    <button
                      onClick={() => handleCancelBin(bin._id)}
                      disabled={actionLoading === bin._id}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {actionLoading === bin._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          Cancel Collection
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}