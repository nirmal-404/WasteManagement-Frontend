import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

type Request = {
  _id: string;
  requestId: string;
  type: 'NORMAL' | 'SPECIAL_EQUIPPED';
  description: string;
  address: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  preferredDate?: string;
  preferredTimeSlot?: string;
  estimatedWeight?: number;
  fee: number;
  assigned?: {
    driverId?: {
      name: string;
      phone: string;
    };
    vehicleId?: {
      plateNo: string;
    };
  };
  scheduledAt?: string;
  rejectionReason?: string;
  customerRating?: {
    rating: number;
    feedback: string;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
};

type Notification = {
  _id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  requestId?: string;
  read: boolean;
  createdAt: string;
};

export default function MyRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SCHEDULED' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchNotifications();
  }, [filter, page]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filter !== 'ALL' && { status: filter })
      });

      const response = await fetch(`${API_URL}/requests/my?${queryParams}`, {
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

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/my`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include'
      });
      
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleSubmitRating = async (requestId: string) => {
    if (rating < 1 || rating > 5) {
      alert('Please select a rating between 1 and 5');
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await fetch(`${API_URL}/requests/${requestId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rating, feedback })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit rating');
      }

      alert('Thank you for your rating!');
      setRating(0);
      setFeedback('');
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to submit rating');
      }
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
      SCHEDULED: 'bg-purple-100 text-purple-800 border-purple-300',
      IN_PROGRESS: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      COMPLETED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300'
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
            <p className="text-gray-600 mt-1">View and manage your collection requests</p>
          </div>
          
          {/* Notifications Bell */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications Panel */}
        {showNotifications && (
          <div className="bg-white rounded-lg shadow-lg mb-6 border border-gray-200 p-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    onClick={() => markNotificationAsRead(notification._id)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      notification.read 
                        ? 'bg-gray-50 border border-gray-200' 
                        : 'bg-blue-50 border border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {notification.type === 'success' ? '✅' : 
                         notification.type === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded mb-6">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Status Change Alerts */}
        {requests.some(r => r.status === 'APPROVED' || r.status === 'SCHEDULED') && (
          <div className="bg-green-50 border-l-4 border-green-500 px-4 py-3 rounded mb-6">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xl">✅</span>
              <div>
                <p className="font-semibold text-green-800">Good News!</p>
                <p className="text-green-700 text-sm">
                  You have requests that have been approved or scheduled. Check your requests below!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'SCHEDULED', 'COMPLETED', 'REJECTED'].map((status) => (
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
                <p className="text-gray-600">Loading your requests...</p>
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
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                            {req.requestId}
                          </p>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(req.status)}`}>
                            {req.status}
                          </span>
                          {req.updatedAt && new Date(req.updatedAt).getTime() > new Date(req.createdAt).getTime() + 60000 && (
                            <span className="text-xs text-blue-600 font-medium">● Updated</span>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-1">{req.description.substring(0, 50)}...</h3>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getUrgencyColor(req.urgency)}`}>
                          {req.urgency}
                        </p>
                        <p className="text-lg font-bold text-emerald-600 mt-1">LKR {req.fee.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
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

          {/* Request Details */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 sticky top-4 space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                
                {/* Status Change Alert */}
                {(selectedRequest.status === 'APPROVED' || selectedRequest.status === 'SCHEDULED') && (
                  <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 text-lg">✅</span>
                      <p className="font-semibold text-green-800">
                        {selectedRequest.status === 'APPROVED' ? 'Request Approved!' : 'Collection Scheduled!'}
                      </p>
                    </div>
                    <p className="text-green-700 text-sm">
                      {selectedRequest.status === 'APPROVED' 
                        ? 'Your request has been approved. We will schedule a collection time soon.'
                        : 'Your collection has been scheduled. See details below.'}
                    </p>
                  </div>
                )}
                
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Request ID</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.requestId}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.type}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-gray-500">Urgency</p>
                    <p className={`font-semibold ${getUrgencyColor(selectedRequest.urgency)}`}>{selectedRequest.urgency}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-semibold text-gray-900">{selectedRequest.address}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Description</p>
                    <p className="text-gray-900">{selectedRequest.description}</p>
                  </div>

                  {selectedRequest.estimatedWeight && (
                    <div>
                      <p className="text-gray-500">Estimated Weight</p>
                      <p className="font-semibold text-gray-900">{selectedRequest.estimatedWeight} kg</p>
                    </div>
                  )}

                  {selectedRequest.preferredDate && (
                    <div>
                      <p className="text-gray-500">Preferred Date</p>
                      <p className="font-semibold text-gray-900">{new Date(selectedRequest.preferredDate).toLocaleDateString()}</p>
                    </div>
                  )}

                  {selectedRequest.preferredTimeSlot && (
                    <div>
                      <p className="text-gray-500">Preferred Time</p>
                      <p className="font-semibold text-gray-900">{selectedRequest.preferredTimeSlot}</p>
                    </div>
                  )}

                  {selectedRequest.status === 'SCHEDULED' && selectedRequest.assigned && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mt-4">
                      <p className="font-semibold text-purple-900 mb-2">📋 Collection Details</p>
                      {selectedRequest.assigned.driverId && (
                        <div className="mb-2">
                          <p className="text-purple-800 text-xs">Assigned Driver</p>
                          <p className="font-semibold text-purple-900">{selectedRequest.assigned.driverId.name}</p>
                          <p className="text-purple-700 text-xs">{selectedRequest.assigned.driverId.phone}</p>
                        </div>
                      )}
                      {selectedRequest.assigned.vehicleId && (
                        <div className="mb-2">
                          <p className="text-purple-800 text-xs">Vehicle</p>
                          <p className="font-semibold text-purple-900">{selectedRequest.assigned.vehicleId.plateNo}</p>
                        </div>
                      )}
                      {selectedRequest.scheduledAt && (
                        <div>
                          <p className="text-purple-800 text-xs">Scheduled Date/Time</p>
                          <p className="font-semibold text-purple-900">{new Date(selectedRequest.scheduledAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-red-800 font-medium">Rejection Reason</p>
                      <p className="text-red-700 text-sm mt-1">{selectedRequest.rejectionReason}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-500">Fee</p>
                    <p className="font-bold text-emerald-600 text-lg">LKR {selectedRequest.fee.toFixed(2)}</p>
                  </div>
                </div>

                {/* Rating Section */}
                {selectedRequest.status === 'COMPLETED' && !selectedRequest.customerRating && (
                  <div className="border-t pt-4 mt-4 space-y-3">
                    <p className="font-semibold text-gray-900">Rate This Service</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`text-2xl transition ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your feedback..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSubmitRating(selectedRequest._id)}
                      disabled={submittingRating}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium"
                    >
                      {submittingRating ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                )}

                {selectedRequest.customerRating && (
                  <div className="border-t pt-4 mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-gray-900 mb-2">Your Rating</p>
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < selectedRequest.customerRating!.rating ? 'text-yellow-400' : 'text-gray-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    {selectedRequest.customerRating.feedback && (
                      <p className="text-sm text-gray-700">{selectedRequest.customerRating.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center sticky top-4">
                <p className="text-3xl mb-2">👈</p>
                <p className="text-gray-600">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}