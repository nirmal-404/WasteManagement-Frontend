import { useState, useEffect } from 'react';
const API_URL = 'http://localhost:4000/api';

type Request = {
  _id: string;
  requestId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    zone?: string;
  };
  type: 'NORMAL' | 'SPECIAL_EQUIPPED';
  description: string;
  address: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  preferredDate?: string;
  preferredTimeSlot?: string;
  estimatedWeight?: number;
  estimatedVolume?: number;
  remarks?: string;
  fee: number;
  assigned?: {
    driverId?: {
      _id: string;
      name: string;
      phone: string;
    };
    vehicleId?: {
      _id: string;
      plateNo: string;
      capacityKg: number;
    };
    collectors?: Array<{
      _id: string;
      name: string;
      phone: string;
    }>;
    equipment?: string[];
  };
  scheduledAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
};

type Driver = {
  _id: string;
  name: string;
  phone: string;
};

type Vehicle = {
  _id: string;
  plateNo: string;
  capacityKg: number;
};

type Collector = {
  _id: string;
  name: string;
  phone: string;
};

export default function RequestManagement() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED'>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Schedule form states
  const [scheduledAt, setScheduledAt] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedCollectors, setSelectedCollectors] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [scheduleAdminNotes, setScheduleAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingRoute, setGeneratingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');

  useEffect(() => {
    fetchRequests();
    fetchDriversAndVehicles();
  }, [filter, page]);

  const handleGenerateRoute = async (request: Request) => {
    setGeneratingRoute(true);
    try {
      console.log('Generating route for request:', request.requestId);
      console.log('API URL:', API_URL);
      
      const routePayload = {
        routeName: `Route for ${request.requestId}`,
        startLocation: {
          latitude: 6.9271,
          longitude: 80.7744
        }
      };
      
      console.log('Route payload:', routePayload);
      
      const routeResponse = await fetch(`${API_URL}/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(routePayload)
      });

      console.log('Route response status:', routeResponse.status);
      const routeData = await routeResponse.json();
      console.log('Route response data:', routeData);

      if (!routeResponse.ok) {
        throw new Error(routeData.message || `Failed to generate route (Status: ${routeResponse.status})`);
      }

      // Show route in new window
      if (routeData.directionsUrl) {
        window.open(routeData.directionsUrl, '_blank');
        alert('Route generated successfully! Opening Google Maps directions...');
      } else {
        alert(`Route generated successfully with ID: ${routeData._id || 'unknown'}`);
      }
      
      setGeneratingRoute(false);
    } catch (err: unknown) {
      console.error('Route generation error:', err);
      if (err instanceof Error) {
        alert('Failed to generate route: ' + err.message);
      } else {
        alert('Failed to generate route');
      }
      setGeneratingRoute(false);
    }
  };

  const handleCheckRoute = async (request: Request) => {
    setGeneratingRoute(true);
    try {
      // Get all existing routes
      const routesResponse = await fetch(`${API_URL}/routes`);
      const routesData = await routesResponse.json();

      if (!routesResponse.ok) {
        throw new Error('Failed to fetch routes');
      }

      if (routesData.length === 0) {
        alert('No existing routes. Would you like to generate a new one?');
        setGeneratingRoute(false);
        return;
      }

      // Display existing routes
      let routesList = 'Existing Routes:\n\n';
      routesData.forEach((route: any, index: number) => {
        routesList += `${index + 1}. ${route.routeName || 'Route ' + (index + 1)} - Status: ${route.status}\n`;
      });

      alert(routesList + '\nYou can add this location to an existing route or generate a new one.');
      
      // Open first route's directions if available
      if (routesData[0]?.directionsUrl) {
        const shouldOpen = confirm('Would you like to view the first route on Google Maps?');
        if (shouldOpen) {
          window.open(routesData[0].directionsUrl, '_blank');
        }
      }

      setGeneratingRoute(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Failed to check routes: ' + err.message);
      } else {
        alert('Failed to check routes');
      }
      setGeneratingRoute(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filter !== 'ALL' && { status: filter })
      });

      const response = await fetch(`${API_URL}/requests?${queryParams}`, {
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch requests');
      }

      setRequests(data.requests);
      setTotalPages(data.pagination.pages);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDriversAndVehicles = async () => {
  try {
    console.log('Fetching drivers, collectors, and vehicles...');

    // Fetch drivers (users with DRIVER role)
    const driversRes = await fetch(`${API_URL}/users?role=DRIVER`, {
      credentials: 'include'
    });
    if (driversRes.ok) {
      const driversData = await driversRes.json();
      const driversList = driversData.users || [];
      console.log('Drivers:', driversList);
      setDrivers(driversList);
    } else {
      setDrivers([]);
    }

    // Fetch collectors (users with COLLECTOR role)
    const collectorsRes = await fetch(`${API_URL}/users?role=COLLECTOR`, {
      credentials: 'include'
    });
    if (collectorsRes.ok) {
      const collectorsData = await collectorsRes.json();
      const collectorsList = collectorsData.users || [];
      console.log('Collectors:', collectorsList);
      setCollectors(collectorsList);
    } else {
      setCollectors([]);
    }

    // Fetch trucks (vehicles)
    const trucksRes = await fetch(`${API_URL}/trucks`, {
      credentials: 'include'
    });
    if (trucksRes.ok) {
      const trucksData = await trucksRes.json();
      const trucksList = trucksData.trucks || [];
      console.log('Trucks:', trucksList);
      setVehicles(trucksList);
    } else {
      setVehicles([]);
    }
  } catch (err) {
    console.error('Error fetching drivers/collectors/trucks:', err);
    setDrivers([]);
    setCollectors([]);
    setVehicles([]);
  }
};

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/requests/${selectedRequest._id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adminNotes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to approve request');
      }

      alert('Request approved successfully!');
      setShowApprovalModal(false);
      setAdminNotes('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to approve request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/requests/${selectedRequest._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rejectionReason, adminNotes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reject request');
      }

      alert('Request rejected successfully!');
      setShowRejectionModal(false);
      setRejectionReason('');
      setAdminNotes('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to reject request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleRequest = async () => {
    if (!selectedRequest) return;

    if (!scheduledAt || !selectedDriver || !selectedVehicle) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate that IDs are proper MongoDB ObjectIds
    const isValidObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

    if (!isValidObjectId(selectedDriver)) {
      alert('Invalid driver selected. Please refresh and try again.');
      return;
    }

    if (!isValidObjectId(selectedVehicle)) {
      alert('Invalid vehicle selected. Please refresh and try again.');
      return;
    }

    // Validate collectors if any are selected
    for (const collectorId of selectedCollectors) {
      if (!isValidObjectId(collectorId)) {
        alert('Invalid collector selected. Please refresh and try again.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/requests/${selectedRequest._id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scheduledAt: new Date(scheduledAt).toISOString(),
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
          collectors: selectedCollectors,
          equipment: selectedEquipment,
          adminNotes: scheduleAdminNotes
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to schedule request');
      }

      alert('Request scheduled successfully!');
      setShowScheduleModal(false);
      setScheduledAt('');
      setSelectedDriver('');
      setSelectedVehicle('');
      setSelectedCollectors([]);
      setSelectedEquipment([]);
      setScheduleAdminNotes('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to schedule request');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
      SCHEDULED: 'bg-purple-100 text-purple-800 border-purple-300',
      IN_PROGRESS: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: { [key: string]: string } = {
      LOW: 'text-green-600',
      MEDIUM: 'text-yellow-600',
      HIGH: 'text-red-600'
    };
    return colors[urgency] || 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Request Management</h1>
          <p className="text-gray-600 mt-1">Review, approve, and schedule waste collection requests</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded mb-6">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status as any);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
                <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center border border-gray-200">
                <p className="text-3xl mb-4">📋</p>
                <p className="text-gray-600">No requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div
                    key={req._id}
                    onClick={() => setSelectedRequest(req)}
                    className={`bg-white rounded-lg shadow border-l-4 p-4 cursor-pointer transition hover:shadow-lg ${
                      selectedRequest?._id === req._id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">{req.requestId}</p>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{req.userId.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{req.description.substring(0, 60)}...</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getUrgencyColor(req.urgency)}`}>{req.urgency}</p>
                        <p className="text-lg font-bold text-emerald-600 mt-1">LKR {req.fee}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 bg-white rounded-lg p-4 border border-gray-200">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Request Details & Actions */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 sticky top-4 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                
                <div className="space-y-3 text-sm">
                  {/* User Info */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-blue-900 font-semibold mb-2">User Information</p>
                    <p className="text-blue-800"><span className="font-medium">Name:</span> {selectedRequest.userId.name}</p>
                    <p className="text-blue-800"><span className="font-medium">Email:</span> {selectedRequest.userId.email}</p>
                    <p className="text-blue-800"><span className="font-medium">Phone:</span> {selectedRequest.userId.phone}</p>
                    <p className="text-blue-800"><span className="font-medium">Address:</span> {selectedRequest.userId.address}</p>
                    {selectedRequest.userId.zone && (
                      <p className="text-blue-800"><span className="font-medium">Zone:</span> {selectedRequest.userId.zone}</p>
                    )}
                  </div>

                  {/* Request Details */}
                  <div>
                    <p className="text-gray-500 font-medium">Request Type</p>
                    <p className="font-semibold text-gray-900 mt-1">{selectedRequest.type}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Urgency</p>
                    <p className={`font-semibold mt-1 ${getUrgencyColor(selectedRequest.urgency)}`}>{selectedRequest.urgency}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Location</p>
                    <p className="text-gray-900 mt-1">{selectedRequest.address}</p>
                  </div>

                  <div>
                    <p className="text-gray-500 font-medium">Description</p>
                    <p className="text-gray-900 mt-1">{selectedRequest.description}</p>
                  </div>

                  {selectedRequest.remarks && (
                    <div>
                      <p className="text-gray-500 font-medium">Remarks</p>
                      <p className="text-gray-900 mt-1">{selectedRequest.remarks}</p>
                    </div>
                  )}

                  {selectedRequest.estimatedWeight && (
                    <div>
                      <p className="text-gray-500 font-medium">Estimated Weight</p>
                      <p className="font-semibold text-gray-900 mt-1">{selectedRequest.estimatedWeight} kg</p>
                    </div>
                  )}

                  {selectedRequest.estimatedVolume && (
                    <div>
                      <p className="text-gray-500 font-medium">Estimated Volume</p>
                      <p className="font-semibold text-gray-900 mt-1">{selectedRequest.estimatedVolume} m³</p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-500 font-medium">Fee</p>
                    <p className="font-bold text-emerald-600 text-lg mt-1">LKR {selectedRequest.fee.toFixed(2)}</p>
                  </div>

                  {/* Scheduled Details */}
                  {selectedRequest.status === 'SCHEDULED' && selectedRequest.assigned && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mt-4">
                      <p className="font-semibold text-purple-900 mb-2">Scheduled Assignment</p>
                      {selectedRequest.assigned.driverId && (
                        <p className="text-purple-800"><span className="font-medium">Driver:</span> {selectedRequest.assigned.driverId.name} ({selectedRequest.assigned.driverId.phone})</p>
                      )}
                      {selectedRequest.assigned.vehicleId && (
                        <p className="text-purple-800"><span className="font-medium">Vehicle:</span> {selectedRequest.assigned.vehicleId.plateNo} ({selectedRequest.assigned.vehicleId.capacityKg} kg)</p>
                      )}
                      {selectedRequest.scheduledAt && (
                        <p className="text-purple-800"><span className="font-medium">Date/Time:</span> {new Date(selectedRequest.scheduledAt).toLocaleString()}</p>
                      )}
                    </div>
                  )}

                  {/* Rejection Details */}
                  {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="font-semibold text-red-900 mb-1">Rejection Reason</p>
                      <p className="text-red-800">{selectedRequest.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 space-y-2">
                  {selectedRequest.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => setShowApprovalModal(true)}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() => setShowRejectionModal(true)}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                      >
                        Reject Request
                      </button>
                    </>
                  )}

                  {selectedRequest.status === 'APPROVED' && (
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                    >
                      Schedule & Assign
                    </button>
                  )}

                  {selectedRequest.type === 'SPECIAL_EQUIPPED' && selectedRequest.status !== 'SCHEDULED' && selectedRequest.status !== 'REJECTED' && (
                    <button
                      onClick={() => {
                        console.log('Generate route clicked');
                        handleGenerateRoute(selectedRequest);
                      }}
                      disabled={generatingRoute}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition"
                    >
                      {generatingRoute ? 'Generating...' : '🗺️ Generate Optimized Route'}
                    </button>
                  )}

                  {selectedRequest.type === 'NORMAL' && selectedRequest.status !== 'SCHEDULED' && selectedRequest.status !== 'REJECTED' && (
                    <button
                      onClick={() => {
                        console.log('Check route clicked');
                        handleCheckRoute(selectedRequest);
                      }}
                      disabled={generatingRoute}
                      className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium transition"
                    >
                      {generatingRoute ? 'Checking...' : '🛣️ Check Existing Route'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center sticky top-4">
                <p className="text-3xl mb-2">👈</p>
                <p className="text-gray-600">Select a request to view details and take action</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Approve Request</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder="Add any internal notes about this approval..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowApprovalModal(false);
                      setAdminNotes('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveRequest}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                  >
                    {submitting ? 'Approving...' : 'Confirm Approval'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Request</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    placeholder="Explain why this request is being rejected..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Add any internal notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      setRejectionReason('');
                      setAdminNotes('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectRequest}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                  >
                    {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full my-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Schedule & Assign Request</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Driver *
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select a driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.name} - {driver.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Vehicle *
                  </label>
                  <select
                    value={selectedVehicle}
                    onChange={(e) => setSelectedVehicle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select a vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.plateNo} ({vehicle.capacityKg} kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Collectors (Optional)
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                    {collectors.map((collector) => (
                      <label key={collector._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCollectors.includes(collector._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCollectors([...selectedCollectors, collector._id]);
                            } else {
                              setSelectedCollectors(selectedCollectors.filter(id => id !== collector._id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{collector.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipment (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter equipment (comma-separated)"
                    value={selectedEquipment.join(', ')}
                    onChange={(e) => setSelectedEquipment(e.target.value.split(',').map(e => e.trim()).filter(e => e))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={scheduleAdminNotes}
                    onChange={(e) => setScheduleAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Add any notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowScheduleModal(false);
                      setScheduledAt('');
                      setSelectedDriver('');
                      setSelectedVehicle('');
                      setSelectedCollectors([]);
                      setSelectedEquipment([]);
                      setScheduleAdminNotes('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScheduleRequest}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {submitting ? 'Scheduling...' : 'Schedule Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}