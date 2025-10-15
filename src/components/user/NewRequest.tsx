import { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

export default function NewRequest() {
  type RequestType = 'NORMAL' | 'SPECIAL_EQUIPPED';
  type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH';
  type FeeBreakdown = {
    baseFee: number;
    weightFee: number;
    urgencyFee: number;
    total: number;
  };

  type FormData = {
    type: RequestType;
    description: string;
    address: string;
    urgency: UrgencyLevel;
    preferredTimeSlot: string;
    remarks?: string;
    preferredDate?: string;
    estimatedWeight?: string;
    estimatedVolume?: string;
  };

  type RequestBody = {
    type: RequestType;
    description: string;
    address: string;
    urgency: UrgencyLevel;
    preferredTimeSlot: string;
    remarks?: string;
    preferredDate?: string;
    estimatedWeight?: number;
    estimatedVolume?: number;
  };

  type ValidationError = {
    msg: string;
    param?: string;
    [key: string]: any; // Optional extra fields from express-validator
  };

  const [formData, setFormData] = useState<FormData>({
    type: 'NORMAL' as RequestType,
    description: '',
    remarks: '',
    address: '',
    preferredDate: '',
    preferredTimeSlot: 'MORNING',
    urgency: 'LOW' as UrgencyLevel,
    estimatedWeight: '',
    estimatedVolume: ''
  });
  
  const [feeBreakdown, setFeeBreakdown] = useState<FeeBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Fee configuration matching backend
  const FEE_CONFIG: Record<RequestType, number> = {
    NORMAL: 800,
    SPECIAL_EQUIPPED: 1300
  };

  const URGENCY_FEE: Record<UrgencyLevel, number> = {
    LOW: 0,
    MEDIUM: 200,
    HIGH: 500
  };

  const WEIGHT_FEE_PER_KG = 50;

  // Calculate fee whenever relevant fields change
  useEffect(() => {
    const baseFee = FEE_CONFIG[formData.type];
    const urgencyFee = URGENCY_FEE[formData.urgency];
    const weightFee = formData.estimatedWeight ? parseFloat(formData.estimatedWeight) * WEIGHT_FEE_PER_KG : 0;
    
    setFeeBreakdown({
      baseFee,
      weightFee,
      urgencyFee,
      total: baseFee + weightFee + urgencyFee
    });
  }, [formData.type, formData.urgency, formData.estimatedWeight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    setError('');
    setValidationErrors([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setValidationErrors([]);
    
    try {
      // Prepare request body matching backend expectations
      const requestBody : RequestBody = {
        type: formData.type,
        description: formData.description,
        address: formData.address,
        urgency: formData.urgency,
        preferredTimeSlot: formData.preferredTimeSlot,
        remarks: formData.remarks || undefined,
        preferredDate: formData.preferredDate || undefined,
        estimatedWeight: formData.estimatedWeight ? parseFloat(formData.estimatedWeight) : undefined,
        estimatedVolume: formData.estimatedVolume ? parseFloat(formData.estimatedVolume) : undefined,
      };

      console.log('Submitting request:', requestBody);

      // Add optional fields only if they have values
      if (formData.remarks) {
        requestBody.remarks = formData.remarks;
      }
      
      if (formData.preferredDate) {
        requestBody.preferredDate = formData.preferredDate;
      }
      
      if (formData.estimatedWeight) {
        requestBody.estimatedWeight = parseFloat(formData.estimatedWeight);
      }
      
      if (formData.estimatedVolume) {
        requestBody.estimatedVolume = parseFloat(formData.estimatedVolume);
      }

      const response = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle validation errors from express-validator
        if (data.errors && Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
          setError('Please fix the validation errors below');
        } else {
          setError(data.message || 'Failed to create request');
        }
        return;
      }

      // Success
      setSuccess(true);
      console.log('Request created:', data.request);
      
      // Reset form
      setFormData({
        type: 'NORMAL',
        description: '',
        remarks: '',
        address: '',
        preferredDate: '',
        preferredTimeSlot: 'MORNING',
        urgency: 'LOW',
        estimatedWeight: '',
        estimatedVolume: ''
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err: unknown) {
      console.error('Request submission error:', err);

      if (err instanceof Error) {
        // Safe to access err.message
        setError(err.message || 'Network error. Please check your connection.');
      } else {
        // Handles any non-Error thrown values
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Collection Request</h1>
          <p className="text-gray-600 mt-1">Submit a request for special waste collection</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded shadow">
            <div className="flex items-center">
              <span className="text-xl mr-2">✓</span>
              <div>
                <p className="font-semibold">Request submitted successfully!</p>
                <p className="text-sm">We'll review your request and get back to you soon.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded shadow">
            <div className="flex items-center">
              <span className="text-xl mr-2">✕</span>
              <p className="font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 px-4 py-3 rounded shadow">
            <p className="font-semibold mb-2">Validation Errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((err, idx) => (
                <li key={idx} className="text-sm">{err.msg}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Form */}
        <div className="bg-white p-8 rounded-lg shadow border border-gray-200 space-y-6">
          
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Request Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                formData.type === 'NORMAL' 
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="NORMAL"
                  checked={formData.type === 'NORMAL'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-3xl mb-2">🗑️</div>
                  <div className="font-semibold text-gray-900">Normal Collection</div>
                  <div className="text-sm text-gray-600 mt-1">Standard waste removal</div>
                  <div className="text-emerald-600 font-medium mt-2">LKR 800 base fee</div>
                </div>
              </label>
              
              <label className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                formData.type === 'SPECIAL_EQUIPPED' 
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="type"
                  value="SPECIAL_EQUIPPED"
                  checked={formData.type === 'SPECIAL_EQUIPPED'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-3xl mb-2">🚛</div>
                  <div className="font-semibold text-gray-900">Special Equipment</div>
                  <div className="text-sm text-gray-600 mt-1">Heavy or hazardous items</div>
                  <div className="text-emerald-600 font-medium mt-2">LKR 1,300 base fee</div>
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe the waste items to be collected (e.g., furniture, electronic waste, construction debris)..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Collection Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              placeholder="Enter your full address with street, city, and postal code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Estimated Weight and Volume */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Weight (kg)
              </label>
              <input
                type="number"
                name="estimatedWeight"
                value={formData.estimatedWeight}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="e.g., 50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">💡 LKR 50 per kg will be added to the fee</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Volume (m³)
              </label>
              <input
                type="number"
                name="estimatedVolume"
                value={formData.estimatedVolume}
                onChange={handleChange}
                min="0"
                step="0.1"
                placeholder="e.g., 2.5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">💡 Helps us assign the right vehicle</p>
            </div>
          </div>

          {/* Urgency Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Urgency Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'LOW', label: 'Low', icon: '🟢', desc: 'Standard' },
                { value: 'MEDIUM', label: 'Medium', icon: '🟡', desc: 'Priority' },
                { value: 'HIGH', label: 'High', icon: '🔴', desc: 'Urgent' }
              ].map((level) => (
                <label
                  key={level.value}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition text-center ${
                    formData.urgency === level.value
                      ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    value={level.value}
                    checked={formData.urgency === level.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="text-2xl mb-1">{level.icon}</div>
                  <div className="font-semibold text-gray-900">{level.label}</div>
                  <div className="text-xs text-gray-600">{level.desc}</div>
                  <div className="text-xs font-medium text-emerald-600 mt-1">
                    +LKR {URGENCY_FEE[level.value as UrgencyLevel]}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Date and Time Slot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Date
              </label>
              <input
                type="date"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">💡 Optional - we'll contact you to confirm</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time Slot
              </label>
              <select
                name="preferredTimeSlot"
                value={formData.preferredTimeSlot}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition bg-white"
              >
                <option value="MORNING">🌅 Morning (8 AM - 12 PM)</option>
                <option value="AFTERNOON">☀️ Afternoon (12 PM - 4 PM)</option>
                <option value="EVENING">🌆 Evening (4 PM - 8 PM)</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              placeholder="Any special instructions, access information, or additional details..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          {/* Fee Breakdown */}
          {feeBreakdown && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg p-5 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center text-lg">
                <span className="text-2xl mr-2">💰</span>
                Estimated Fee Breakdown
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Base Fee ({formData.type === 'NORMAL' ? 'Normal' : 'Special Equipment'}):</span>
                  <span className="font-semibold text-gray-900">LKR {feeBreakdown.baseFee.toFixed(2)}</span>
                </div>
                {feeBreakdown.weightFee > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Weight Fee ({formData.estimatedWeight} kg × LKR 50):</span>
                    <span className="font-semibold text-gray-900">LKR {feeBreakdown.weightFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Urgency Fee ({formData.urgency}):</span>
                  <span className="font-semibold text-gray-900">LKR {feeBreakdown.urgencyFee.toFixed(2)}</span>
                </div>
                <div className="border-t-2 border-emerald-300 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-base">Total Estimated Fee:</span>
                  <span className="font-bold text-emerald-600 text-2xl">
                    LKR {feeBreakdown.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3 italic">
                * Final fee may vary based on actual weight and conditions
              </p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                '✓ Submit Request'
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <h4 className="font-semibold text-blue-900 mb-2">📋 What happens next?</h4>
          <ul className="space-y-1 text-blue-800">
            <li>• Your request will be reviewed by our admin team</li>
            <li>• You'll receive a confirmation via email/SMS</li>
            <li>• Once approved, we'll schedule your collection</li>
            <li>• A driver will be assigned and you'll be notified</li>
          </ul>
        </div>
      </div>
    </div>
  );
}