import { useState, useEffect } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  zone?: string;
}

interface Vehicle {
  _id: string;
  plateNo: string;
  capacityKg: number;
}

interface Assignment {
  driverId?: User;
  vehicleId?: Vehicle;
  collectors?: User[];
  equipment?: string[];
}

interface Request {
  _id: string;
  requestId: string;
  userId: User;
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
  assigned?: Assignment;
  scheduledAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
}

type RequestStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED';

interface ScheduleFormData {
  scheduledAt: string;
  driverId: string;
  vehicleId: string;
  collectors: string[];
  equipment: string[];
  adminNotes: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-300',
  SCHEDULED: 'bg-purple-100 text-purple-800 border-purple-300',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300'
};

const URGENCY_COLORS: Record<string, string> = {
  LOW: 'text-green-600',
  MEDIUM: 'text-yellow-600',
  HIGH: 'text-red-600'
};

const DEFAULT_START_LOCATION = {
  latitude: 6.9271,
  longitude: 80.7744
};

// ============================================================================
// UTILITY FUNCTIONS (Single Responsibility)
// ============================================================================

const isValidObjectId = (id: string): boolean => /^[0-9a-f]{24}$/.test(id);

const getStatusColor = (status: string): string => 
  STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-300';

const getUrgencyColor = (urgency: string): string => 
  URGENCY_COLORS[urgency] || 'text-gray-600';

const formatDateTime = (dateString: string): string => 
  new Date(dateString).toLocaleString();

// ============================================================================
// API SERVICE (Single Responsibility - API calls)
// ============================================================================

class RequestApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetchRequests(filter: RequestStatus, page: number, limit: number = 10) {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filter !== 'ALL' && { status: filter })
    });

    const response = await fetch(`${this.baseUrl}/requests?${queryParams}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to fetch requests');
    }

    return response.json();
  }

  async fetchUsersByRole(role: 'DRIVER' | 'COLLECTOR') {
    const response = await fetch(`${this.baseUrl}/users?role=${role}`, {
      credentials: 'include'
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    return data.users || [];
  }

  async fetchVehicles() {
    const response = await fetch(`${this.baseUrl}/trucks`, {
      credentials: 'include'
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    return data.trucks || [];
  }

  async approveRequest(requestId: string, adminNotes?: string) {
    const response = await fetch(`${this.baseUrl}/requests/${requestId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ adminNotes })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to approve request');
    }

    return response.json();
  }

  async rejectRequest(requestId: string, rejectionReason: string, adminNotes?: string) {
    const response = await fetch(`${this.baseUrl}/requests/${requestId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ rejectionReason, adminNotes })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to reject request');
    }

    return response.json();
  }

  async scheduleRequest(requestId: string, scheduleData: ScheduleFormData) {
    const response = await fetch(`${this.baseUrl}/requests/${requestId}/schedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        scheduledAt: new Date(scheduleData.scheduledAt).toISOString(),
        driverId: scheduleData.driverId,
        vehicleId: scheduleData.vehicleId,
        collectors: scheduleData.collectors,
        equipment: scheduleData.equipment,
        adminNotes: scheduleData.adminNotes
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to schedule request');
    }

    return response.json();
  }

  async createRoute(routeName: string) {
    const response = await fetch(`${this.baseUrl}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        routeName,
        startLocation: DEFAULT_START_LOCATION
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `Failed to generate route (Status: ${response.status})`);
    }

    return response.json();
  }

  async fetchRoutes() {
    const response = await fetch(`${this.baseUrl}/routes`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch routes');
    }

    return response.json();
  }
}

// ============================================================================
// VALIDATION SERVICE (Single Responsibility)
// ============================================================================

class ValidationService {
  validateScheduleForm(data: ScheduleFormData): string | null {
    if (!data.scheduledAt || !data.driverId || !data.vehicleId) {
      return 'Please fill in all required fields';
    }

    if (!isValidObjectId(data.driverId)) {
      return 'Invalid driver selected. Please refresh and try again.';
    }

    if (!isValidObjectId(data.vehicleId)) {
      return 'Invalid vehicle selected. Please refresh and try again.';
    }

    for (const collectorId of data.collectors) {
      if (!isValidObjectId(collectorId)) {
        return 'Invalid collector selected. Please refresh and try again.';
      }
    }

    return null;
  }

  validateRejectionReason(reason: string): string | null {
    if (!reason.trim()) {
      return 'Please provide a rejection reason';
    }
    return null;
  }
}

// ============================================================================
// CUSTOM HOOKS (Separation of Concerns)
// ============================================================================

function useRequestData(apiService: RequestApiService) {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<RequestStatus>('PENDING');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.fetchRequests(filter, page);
      setRequests(data.requests);
      setTotalPages(data.pagination.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter, page]);

  return {
    requests,
    loading,
    error,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    refetch: fetchRequests
  };
}

function useResourceData(apiService: RequestApiService) {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [collectors, setCollectors] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const fetchResources = async () => {
    try {
      const [driversList, collectorsList, vehiclesList] = await Promise.all([
        apiService.fetchUsersByRole('DRIVER'),
        apiService.fetchUsersByRole('COLLECTOR'),
        apiService.fetchVehicles()
      ]);

      setDrivers(driversList);
      setCollectors(collectorsList);
      setVehicles(vehiclesList);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setDrivers([]);
      setCollectors([]);
      setVehicles([]);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  return { drivers, collectors, vehicles };
}

// ============================================================================
// COMPONENTS (Single Responsibility)
// ============================================================================

interface FilterTabsProps {
  currentFilter: RequestStatus;
  onFilterChange: (filter: RequestStatus) => void;
}

function FilterTabs({ currentFilter, onFilterChange }: FilterTabsProps) {
  const filters: RequestStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED', 'ALL'];

  return (
    <div className="bg-white rounded-lg shadow mb-6 border border-gray-200 p-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((status) => (
          <button
            key={status}
            onClick={() => {
              onFilterChange(status);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              currentFilter === status
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}

interface RequestCardProps {
  request: Request;
  isSelected: boolean;
  onClick: () => void;
}

function RequestCard({ request, isSelected, onClick }: RequestCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow border-l-4 p-4 cursor-pointer transition hover:shadow-lg ${
        isSelected
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-gray-200 hover:border-emerald-300'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
              {request.requestId}
            </p>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">{request.userId.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{request.description.substring(0, 60)}...</p>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${getUrgencyColor(request.urgency)}`}>
            {request.urgency}
          </p>
          <p className="text-lg font-bold text-emerald-600 mt-1">LKR {request.fee}</p>
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-6 bg-white rounded-lg p-4 border border-gray-200">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-gray-600">Page {currentPage} of {totalPages}</span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}

interface RequestDetailsProps {
  request: Request;
  onApprove: () => void;
  onReject: () => void;
  onSchedule: () => void;
  onGenerateRoute: () => void;
  onCheckRoute: () => void;
  isGeneratingRoute: boolean;
}

function RequestDetails({
  request,
  onApprove,
  onReject,
  onSchedule,
  onGenerateRoute,
  onCheckRoute,
  isGeneratingRoute
}: RequestDetailsProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 sticky top-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
      
      <div className="space-y-3 text-sm">
        <UserInfoSection user={request.userId} />
        <RequestInfoSection request={request} />
        {request.status === 'SCHEDULED' && request.assigned && (
          <ScheduledAssignmentSection assignment={request.assigned} scheduledAt={request.scheduledAt} />
        )}
        {request.status === 'REJECTED' && request.rejectionReason && (
          <RejectionSection reason={request.rejectionReason} />
        )}
      </div>

      <ActionButtons
        request={request}
        onApprove={onApprove}
        onReject={onReject}
        onSchedule={onSchedule}
        onGenerateRoute={onGenerateRoute}
        onCheckRoute={onCheckRoute}
        isGeneratingRoute={isGeneratingRoute}
      />
    </div>
  );
}

function UserInfoSection({ user }: { user: User }) {
  return (
    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
      <p className="text-blue-900 font-semibold mb-2">User Information</p>
      <p className="text-blue-800"><span className="font-medium">Name:</span> {user.name}</p>
      <p className="text-blue-800"><span className="font-medium">Email:</span> {user.email}</p>
      <p className="text-blue-800"><span className="font-medium">Phone:</span> {user.phone}</p>
      <p className="text-blue-800"><span className="font-medium">Address:</span> {user.address}</p>
      {user.zone && (
        <p className="text-blue-800"><span className="font-medium">Zone:</span> {user.zone}</p>
      )}
    </div>
  );
}

function RequestInfoSection({ request }: { request: Request }) {
  return (
    <>
      <InfoField label="Request Type" value={request.type} />
      <InfoField 
        label="Status" 
        value={
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
            {request.status}
          </span>
        } 
      />
      <InfoField 
        label="Urgency" 
        value={<span className={`font-semibold ${getUrgencyColor(request.urgency)}`}>{request.urgency}</span>} 
      />
      <InfoField label="Location" value={request.address} />
      <InfoField label="Description" value={request.description} />
      {request.remarks && <InfoField label="Remarks" value={request.remarks} />}
      {request.estimatedWeight && <InfoField label="Estimated Weight" value={`${request.estimatedWeight} kg`} />}
      {request.estimatedVolume && <InfoField label="Estimated Volume" value={`${request.estimatedVolume} m³`} />}
      <InfoField 
        label="Fee" 
        value={<span className="font-bold text-emerald-600 text-lg">LKR {request.fee.toFixed(2)}</span>} 
      />
    </>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-gray-500 font-medium">{label}</p>
      <div className="mt-1">{typeof value === 'string' ? <p className="text-gray-900">{value}</p> : value}</div>
    </div>
  );
}

function ScheduledAssignmentSection({ assignment, scheduledAt }: { assignment: Assignment; scheduledAt?: string }) {
  return (
    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mt-4">
      <p className="font-semibold text-purple-900 mb-2">Scheduled Assignment</p>
      {assignment.driverId && (
        <p className="text-purple-800">
          <span className="font-medium">Driver:</span> {assignment.driverId.name} ({assignment.driverId.phone})
        </p>
      )}
      {assignment.vehicleId && (
        <p className="text-purple-800">
          <span className="font-medium">Vehicle:</span> {assignment.vehicleId.plateNo} ({assignment.vehicleId.capacityKg} kg)
        </p>
      )}
      {scheduledAt && (
        <p className="text-purple-800">
          <span className="font-medium">Date/Time:</span> {formatDateTime(scheduledAt)}
        </p>
      )}
    </div>
  );
}

function RejectionSection({ reason }: { reason: string }) {
  return (
    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
      <p className="font-semibold text-red-900 mb-1">Rejection Reason</p>
      <p className="text-red-800">{reason}</p>
    </div>
  );
}

interface ActionButtonsProps {
  request: Request;
  onApprove: () => void;
  onReject: () => void;
  onSchedule: () => void;
  onGenerateRoute: () => void;
  onCheckRoute: () => void;
  isGeneratingRoute: boolean;
}

function ActionButtons({
  request,
  onApprove,
  onReject,
  onSchedule,
  onGenerateRoute,
  onCheckRoute,
  isGeneratingRoute
}: ActionButtonsProps) {
  const showRouteButton = request.status !== 'SCHEDULED' && request.status !== 'REJECTED';

  return (
    <div className="border-t pt-4 space-y-2">
      {request.status === 'PENDING' && (
        <>
          <button
            onClick={onApprove}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
          >
            Approve Request
          </button>
          <button
            onClick={onReject}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
          >
            Reject Request
          </button>
        </>
      )}

      {request.status === 'APPROVED' && (
        <button
          onClick={onSchedule}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
        >
          Schedule & Assign
        </button>
      )}

      {request.type === 'SPECIAL_EQUIPPED' && showRouteButton && (
        <button
          onClick={onGenerateRoute}
          disabled={isGeneratingRoute}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium transition"
        >
          {isGeneratingRoute ? 'Generating...' : '🗺️ Generate Optimized Route'}
        </button>
      )}

      {request.type === 'NORMAL' && showRouteButton && (
        <button
          onClick={onCheckRoute}
          disabled={isGeneratingRoute}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium transition"
        >
          {isGeneratingRoute ? 'Checking...' : '🛣️ Check Existing Route'}
        </button>
      )}
    </div>
  );
}

interface ApprovalModalProps {
  isOpen: boolean;
  adminNotes: string;
  onAdminNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ApprovalModal({
  isOpen,
  adminNotes,
  onAdminNotesChange,
  onConfirm,
  onCancel,
  isSubmitting
}: ApprovalModalProps) {
  if (!isOpen) return null;

  return (
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
              onChange={(e) => onAdminNotesChange(e.target.value)}
              rows={4}
              placeholder="Add any internal notes about this approval..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RejectionModalProps {
  isOpen: boolean;
  rejectionReason: string;
  adminNotes: string;
  onRejectionReasonChange: (reason: string) => void;
  onAdminNotesChange: (notes: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function RejectionModal({
  isOpen,
  rejectionReason,
  adminNotes,
  onRejectionReasonChange,
  onAdminNotesChange,
  onConfirm,
  onCancel,
  isSubmitting
}: RejectionModalProps) {
  if (!isOpen) return null;

  return (
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
              onChange={(e) => onRejectionReasonChange(e.target.value)}
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
              onChange={(e) => onAdminNotesChange(e.target.value)}
              rows={2}
              placeholder="Add any internal notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScheduleModalProps {
  isOpen: boolean;
  formData: ScheduleFormData;
  drivers: User[];
  collectors: User[];
  vehicles: Vehicle[];
  onFormChange: (field: keyof ScheduleFormData, value: any) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ScheduleModal({
  isOpen,
  formData,
  drivers,
  collectors,
  vehicles,
  onFormChange,
  onConfirm,
  onCancel,
  isSubmitting
}: ScheduleModalProps) {
  if (!isOpen) return null;

  return (
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
              value={formData.scheduledAt}
              onChange={(e) => onFormChange('scheduledAt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Driver *
            </label>
            <select
              value={formData.driverId}
              onChange={(e) => onFormChange('driverId', e.target.value)}
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
              value={formData.vehicleId}
              onChange={(e) => onFormChange('vehicleId', e.target.value)}
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
                    checked={formData.collectors.includes(collector._id)}
                    onChange={(e) => {
                      const newCollectors = e.target.checked
                        ? [...formData.collectors, collector._id]
                        : formData.collectors.filter(id => id !== collector._id);
                      onFormChange('collectors', newCollectors);
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
              value={formData.equipment.join(', ')}
              onChange={(e) => {
                const equipment = e.target.value.split(',').map(e => e.trim()).filter(e => e);
                onFormChange('equipment', equipment);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              value={formData.adminNotes}
              onChange={(e) => onFormChange('adminNotes', e.target.value)}
              rows={2}
              placeholder="Add any notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RequestManagement() {
  const apiService = new RequestApiService(API_URL);
  const validationService = new ValidationService();

  // State management
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [generatingRoute, setGeneratingRoute] = useState(false);

  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form states
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormData>({
    scheduledAt: '',
    driverId: '',
    vehicleId: '',
    collectors: [],
    equipment: [],
    adminNotes: ''
  });

  // Custom hooks
  const {
    requests,
    loading,
    error,
    filter,
    setFilter,
    page,
    setPage,
    totalPages,
    refetch
  } = useRequestData(apiService);

  const { drivers, collectors, vehicles } = useResourceData(apiService);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleGenerateRoute = async (request: Request) => {
    setGeneratingRoute(true);
    try {
      const routeData = await apiService.createRoute(`Route for ${request.requestId}`);

      if (routeData.directionsUrl) {
        window.open(routeData.directionsUrl, '_blank');
        alert('Route generated successfully! Opening Google Maps directions...');
      } else {
        alert(`Route generated successfully with ID: ${routeData._id || 'unknown'}`);
      }
    } catch (err) {
      alert('Failed to generate route: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setGeneratingRoute(false);
    }
  };

  const handleCheckRoute = async (request: Request) => {
    setGeneratingRoute(true);
    try {
      const routesData = await apiService.fetchRoutes();

      if (routesData.length === 0) {
        alert('No existing routes. Would you like to generate a new one?');
        return;
      }

      let routesList = 'Existing Routes:\n\n';
      routesData.forEach((route: any, index: number) => {
        routesList += `${index + 1}. ${route.routeName || 'Route ' + (index + 1)} - Status: ${route.status}\n`;
      });

      alert(routesList + '\nYou can add this location to an existing route or generate a new one.');
      
      if (routesData[0]?.directionsUrl) {
        const shouldOpen = confirm('Would you like to view the first route on Google Maps?');
        if (shouldOpen) {
          window.open(routesData[0].directionsUrl, '_blank');
        }
      }
    } catch (err) {
      alert('Failed to check routes: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setGeneratingRoute(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      await apiService.approveRequest(selectedRequest._id, adminNotes);
      alert('Request approved successfully!');
      resetApprovalModal();
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    const validationError = validationService.validateRejectionReason(rejectionReason);
    if (validationError) {
      alert(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await apiService.rejectRequest(selectedRequest._id, rejectionReason, adminNotes);
      alert('Request rejected successfully!');
      resetRejectionModal();
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleRequest = async () => {
    if (!selectedRequest) return;

    const validationError = validationService.validateScheduleForm(scheduleForm);
    if (validationError) {
      alert(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await apiService.scheduleRequest(selectedRequest._id, scheduleForm);
      alert('Request scheduled successfully!');
      resetScheduleModal();
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to schedule request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleFormChange = (field: keyof ScheduleFormData, value: any) => {
    setScheduleForm(prev => ({ ...prev, [field]: value }));
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const resetApprovalModal = () => {
    setShowApprovalModal(false);
    setAdminNotes('');
    setSelectedRequest(null);
  };

  const resetRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionReason('');
    setAdminNotes('');
    setSelectedRequest(null);
  };

  const resetScheduleModal = () => {
    setShowScheduleModal(false);
    setScheduleForm({
      scheduledAt: '',
      driverId: '',
      vehicleId: '',
      collectors: [],
      equipment: [],
      adminNotes: ''
    });
    setSelectedRequest(null);
  };

  const handleFilterChange = (newFilter: RequestStatus) => {
    setFilter(newFilter);
    setPage(1);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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

        <FilterTabs currentFilter={filter} onFilterChange={handleFilterChange} />

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
                  <RequestCard
                    key={req._id}
                    request={req}
                    isSelected={selectedRequest?._id === req._id}
                    onClick={() => setSelectedRequest(req)}
                  />
                ))}
              </div>
            )}

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>

          {/* Request Details & Actions */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <RequestDetails
                request={selectedRequest}
                onApprove={() => setShowApprovalModal(true)}
                onReject={() => setShowRejectionModal(true)}
                onSchedule={() => setShowScheduleModal(true)}
                onGenerateRoute={() => handleGenerateRoute(selectedRequest)}
                onCheckRoute={() => handleCheckRoute(selectedRequest)}
                isGeneratingRoute={generatingRoute}
              />
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center sticky top-4">
                <p className="text-3xl mb-2">👈</p>
                <p className="text-gray-600">Select a request to view details and take action</p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <ApprovalModal
          isOpen={showApprovalModal}
          adminNotes={adminNotes}
          onAdminNotesChange={setAdminNotes}
          onConfirm={handleApproveRequest}
          onCancel={resetApprovalModal}
          isSubmitting={submitting}
        />

        <RejectionModal
          isOpen={showRejectionModal}
          rejectionReason={rejectionReason}
          adminNotes={adminNotes}
          onRejectionReasonChange={setRejectionReason}
          onAdminNotesChange={setAdminNotes}
          onConfirm={handleRejectRequest}
          onCancel={resetRejectionModal}
          isSubmitting={submitting}
        />

        <ScheduleModal
          isOpen={showScheduleModal}
          formData={scheduleForm}
          drivers={drivers}
          collectors={collectors}
          vehicles={vehicles}
          onFormChange={handleScheduleFormChange}
          onConfirm={handleScheduleRequest}
          onCancel={resetScheduleModal}
          isSubmitting={submitting}
        />
      </div>
    </div>
  );
}