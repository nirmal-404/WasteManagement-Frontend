export const BIN_TYPES = ['Organic', 'Plastic', 'Metal', 'Paper', 'Glass']

export const REQUEST_TYPES = [
  { value: 'NORMAL', label: 'Normal Collection', fee: 800 },
  { value: 'SPECIAL_EQUIPPED', label: 'Special Equipped', fee: 1300 },
  { value: 'HAZARDOUS', label: 'Hazardous Waste', fee: 2000 },
  { value: 'BULKY_ITEMS', label: 'Bulky Items', fee: 1500 },
  { value: 'ELECTRONIC_WASTE', label: 'Electronic Waste', fee: 1800 }
]

export const REQUEST_CATEGORIES = [
  { value: 'HOUSEHOLD', label: 'Household Waste' },
  { value: 'GARDEN', label: 'Garden Waste' },
  { value: 'CONSTRUCTION', label: 'Construction Waste' },
  { value: 'MEDICAL', label: 'Medical Waste' },
  { value: 'ELECTRONIC', label: 'Electronic Waste' }
]

export const REQUEST_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'APPROVED', label: 'Approved', color: 'blue' },
  { value: 'REJECTED', label: 'Rejected', color: 'red' },
  { value: 'SCHEDULED', label: 'Scheduled', color: 'purple' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'orange' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' }
]

export const PAYMENT_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'PROCESSING', label: 'Processing', color: 'blue' },
  { value: 'SUCCESS', label: 'Success', color: 'green' },
  { value: 'FAILED', label: 'Failed', color: 'red' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' },
  { value: 'REFUNDED', label: 'Refunded', color: 'orange' }
]

export const ROUTE_STATUSES = [
  { value: 'PLANNED', label: 'Planned', color: 'blue' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'orange' },
  { value: 'COMPLETED', label: 'Completed', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' }
]

export const ZONES = [
  'Zone A - Central',
  'Zone B - North', 
  'Zone C - South',
  'Zone D - East',
  'Zone E - West'
]

export const TIME_SLOTS = [
  { value: 'MORNING', label: 'Morning (6:00 AM - 12:00 PM)' },
  { value: 'AFTERNOON', label: 'Afternoon (12:00 PM - 6:00 PM)' },
  { value: 'EVENING', label: 'Evening (6:00 PM - 10:00 PM)' }
]

export const URGENCY_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'green' },
  { value: 'MEDIUM', label: 'Medium', color: 'yellow' },
  { value: 'HIGH', label: 'High', color: 'red' }
]

export const PAYMENT_METHODS = [
  { value: 'CARD', label: 'Credit/Debit Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'WALLET', label: 'Digital Wallet' },
  { value: 'CASH', label: 'Cash Payment' }
]

export const USER_ROLES = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'RESIDENT', label: 'Resident' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'COLLECTOR', label: 'Collector' },
  { value: 'DRIVER', label: 'Driver' }
]
