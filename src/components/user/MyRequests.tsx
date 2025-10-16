import { useState, useEffect } from 'react';
const API_URL = 'http://localhost:4000/api';

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
  createdAt: string;
};

export default function MyRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SCHEDULED' | 'COMPLETED' | 'REJECTED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    fetchRequests();
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-600 mt-1">View and manage your collection requests</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded mb-6">
            <p className="font-semibold">{error}</p>
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
                      <div>
                        <p className="text-sm text-gray-500">Request ID: {req.requestId}</p>
                        <h3 className="font-semibold text-gray-900 mt-1">{req.description.substring(0, 50)}...</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span className={`font-medium ${getUrgencyColor(req.urgency)}`}>
                        {req.urgency} Urgency
                      </span>
                      <span className="font-semibold text-emerald-600">LKR {req.fee.toFixed(2)}</span>
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
                    <>
                      {selectedRequest.assigned.driverId && (
                        <div>
                          <p className="text-gray-500">Assigned Driver</p>
                          <p className="font-semibold text-gray-900">{selectedRequest.assigned.driverId.name}</p>
                          <p className="text-gray-600">{selectedRequest.assigned.driverId.phone}</p>
                        </div>
                      )}
                      {selectedRequest.assigned.vehicleId && (
                        <div>
                          <p className="text-gray-500">Vehicle</p>
                          <p className="font-semibold text-gray-900">{selectedRequest.assigned.vehicleId.plateNo}</p>
                        </div>
                      )}
                      {selectedRequest.scheduledAt && (
                        <div>
                          <p className="text-gray-500">Scheduled Date/Time</p>
                          <p className="font-semibold text-gray-900">{new Date(selectedRequest.scheduledAt).toLocaleString()}</p>
                        </div>
                      )}
                    </>
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

                {/* Rating Section - Show for Completed Requests */}
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