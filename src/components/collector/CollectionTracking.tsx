import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type Assignment = {
  _id: string;
  requestId: string;
  userId: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  type: 'NORMAL' | 'SPECIAL_EQUIPPED';
  description: string;
  address: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  assigned: {
    driverId: {
      _id: string;
      name: string;
      phone: string;
    };
    vehicleId: {
      _id: string;
      plateNo: string;
      capacityKg: number;
    };
    collectors: Array<{
      _id: string;
      name: string;
      phone: string;
    }>;
    equipment?: string[];
  };
  scheduledAt: string;
  fee: number;
  estimatedWeight?: number;
};

export default function CollectionTracking() {
  const [collections, setCollections] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<Assignment | null>(null);
  const [filter, setFilter] = useState<'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'>('SCHEDULED');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, [filter]);

  const fetchCollections = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching collections for collector...');
      
      // Use the collector-specific endpoint
      const response = await fetch(`${API_URL}/collector/requests/today`, {
        credentials: 'include'
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch collections');
      }

      // The endpoint returns requests array
      let assignedRequests = data.requests || [];
      
      console.log('All requests:', assignedRequests);
      
      // Filter by status
      if (filter !== 'SCHEDULED') {
        assignedRequests = assignedRequests.filter((req: any) => req.status === filter);
      }

      console.log('Filtered requests:', assignedRequests);
      setCollections(assignedRequests);
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch collections');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      alert(`Collection marked as ${newStatus.replace('_', ' ')}`);
      setSelectedCollection(null);
      fetchCollections();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Error: ' + err.message);
      } else {
        alert('Failed to update status');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    const icons: { [key: string]: string } = {
      LOW: '🟢',
      MEDIUM: '🟡',
      HIGH: '🔴'
    };
    return icons[urgency] || '⚪';
  };

  const handleViewRoute = (collection: Assignment) => {
    // Starting point (depot) - you can change this to your actual depot coordinates
    const depotLat = 6.9271;
    const depotLng = 80.7744;
    
    // Get customer address from the collection
    const customerAddress = collection.userId.address;
    
    // Create Google Maps URL with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${depotLat},${depotLng}&destination=${encodeURIComponent(customerAddress)}&travelmode=driving`;
    
    // Open in new window
    window.open(mapsUrl, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'border-blue-500 text-blue-600 bg-blue-50';
      case 'IN_PROGRESS':
        return 'border-yellow-500 text-yellow-600 bg-yellow-50';
      case 'COMPLETED':
        return 'border-green-500 text-green-600 bg-green-50';
      case 'CANCELLED':
        return 'border-red-500 text-red-600 bg-red-50';
      default:
        return 'border-gray-300 text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Collection Tracking</h1>
          <p className="text-gray-600 mt-1">Track and update your collection progress</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded mb-6">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status as any);
                  setSelectedCollection(null);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collections List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
                <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading collections...</p>
              </div>
            ) : collections.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
                <p className="text-3xl mb-4">📦</p>
                <p className="text-gray-600">No collections assigned to you</p>
              </div>
            ) : (
              <div className="space-y-4">
                {collections.map((collection) => (
                  <div
                    key={collection._id}
                    onClick={() => setSelectedCollection(collection)}
                    className={`bg-white rounded-lg shadow border-l-4 p-4 cursor-pointer transition hover:shadow-lg ${
                      selectedCollection?._id === collection._id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getUrgencyIcon(collection.urgency)}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(collection.status)}`}>
                            {collection.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{collection.userId.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{collection.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">{collection.requestId}</p>
                        <p className="text-lg font-bold text-emerald-600">LKR {collection.fee}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>📅 {new Date(collection.scheduledAt).toLocaleDateString()}</span>
                      <span>🕐 {new Date(collection.scheduledAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collection Details & Actions */}
          <div className="lg:col-span-1">
            {selectedCollection ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 sticky top-4 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Collection Details</h2>

                <div className="space-y-3 text-sm">
                  {/* Customer Info */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-blue-900 font-semibold mb-2">Customer Information</p>
                    <p className="text-blue-800"><span className="font-medium">Name:</span> {selectedCollection.userId.name}</p>
                    <p className="text-blue-800"><span className="font-medium">Phone:</span> {selectedCollection.userId.phone}</p>
                    <p className="text-blue-800"><span className="font-medium">Address:</span> {selectedCollection.userId.address}</p>
                  </div>

                  {/* Collection Details */}
                  <div>
                    <p className="text-gray-500 font-medium">Request ID</p>
                    <p className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 mt-1 text-xs">{selectedCollection.requestId}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Type</p>
                    <p className="font-semibold text-gray-900 mt-1">{selectedCollection.type}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Waste Description</p>
                    <p className="text-gray-900 mt-1">{selectedCollection.description}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Scheduled Date & Time</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {new Date(selectedCollection.scheduledAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedCollection.estimatedWeight && (
                    <div>
                      <p className="text-gray-500 font-medium">Estimated Weight</p>
                      <p className="font-semibold text-gray-900 mt-1">{selectedCollection.estimatedWeight} kg</p>
                    </div>
                  )}

                  {/* Vehicle & Driver Info */}
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mt-4">
                    <p className="text-purple-900 font-semibold mb-2">Assignment Details</p>
                    <p className="text-purple-800"><span className="font-medium">Driver:</span> {selectedCollection.assigned.driverId.name}</p>
                    <p className="text-purple-800"><span className="font-medium">Vehicle:</span> {selectedCollection.assigned.vehicleId.plateNo}</p>
                    {selectedCollection.assigned.equipment && selectedCollection.assigned.equipment.length > 0 && (
                      <p className="text-purple-800"><span className="font-medium">Equipment:</span> {selectedCollection.assigned.equipment.join(', ')}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Fee</p>
                    <p className="font-bold text-emerald-600 text-lg mt-1">LKR {selectedCollection.fee.toFixed(2)}</p>
                  </div>
                </div>

                {/* Status Update Buttons */}
                <div className="border-t pt-4 space-y-2">
                  <button
                    onClick={() => handleViewRoute(selectedCollection)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                  >
                    🗺️ View Route on Maps
                  </button>

                  {selectedCollection.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedCollection._id, 'IN_PROGRESS')}
                      disabled={updatingStatus}
                      className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 font-medium transition"
                    >
                      {updatingStatus ? 'Updating...' : 'Start Collection'}
                    </button>
                  )}

                  {selectedCollection.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedCollection._id, 'COMPLETED')}
                      disabled={updatingStatus}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition"
                    >
                      {updatingStatus ? 'Updating...' : 'Mark as Completed'}
                    </button>
                  )}

                  {selectedCollection.status === 'COMPLETED' && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                      <p className="text-green-800 font-semibold">✓ Completed</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center sticky top-4">
                <p className="text-3xl mb-2">👈</p>
                <p className="text-gray-600">Select a collection to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}