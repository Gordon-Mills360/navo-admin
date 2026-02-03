// Admin Role Constants
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATIONS_ADMIN: 'OPERATIONS_ADMIN',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  COMPLIANCE_ADMIN: 'COMPLIANCE_ADMIN',
  SUPPORT_ADMIN: 'SUPPORT_ADMIN',
  VIEW_ONLY: 'VIEW_ONLY',
};

// Driver States (from your spec)
export const DRIVER_STATES = {
  OFFLINE: 'offline',
  ONLINE: 'online',
  ASSIGNED: 'assigned',
  ON_TRIP: 'on_trip',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  BANNED: 'banned',
};

// Passenger States
export const PASSENGER_STATES = {
  IDLE: 'idle',
  SEARCHING: 'searching',
  MATCHED: 'matched',
  ON_TRIP: 'on_trip',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  BLOCKED: 'blocked',
  ACTIVE: 'active',
  RESTRICTED: 'restricted',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
};

// Trip States
export const TRIP_STATES = {
  REQUESTED: 'requested',
  ASSIGNED: 'assigned',
  DRIVER_ARRIVING: 'driver_arriving',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
  CANCELLED_BY_ADMIN: 'cancelled_by_admin',
  EMERGENCY: 'emergency',
};

// Payment States
export const PAYMENT_STATES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
};

// Admin Action Types (for audit logs)
export const ADMIN_ACTIONS = {
  // User Management
  SUSPEND_USER: 'SUSPEND_USER',
  REINSTATE_USER: 'REINSTATE_USER',
  BAN_USER: 'BAN_USER',
  APPROVE_DRIVER: 'APPROVE_DRIVER',
  REJECT_DRIVER: 'REJECT_DRIVER',
  
  // Trip Management
  FORCE_CANCEL_TRIP: 'FORCE_CANCEL_TRIP',
  REASSIGN_DRIVER: 'REASSIGN_DRIVER',
  OVERRIDE_TRIP_STATE: 'OVERRIDE_TRIP_STATE',
  
  // Finance
  PROCESS_REFUND: 'PROCESS_REFUND',
  APPROVE_PAYOUT: 'APPROVE_PAYOUT',
  FREEZE_WALLET: 'FREEZE_WALLET',
  UNFREEZE_WALLET: 'UNFREEZE_WALLET',
  ADJUST_BALANCE: 'ADJUST_BALANCE',
  
  // System
  UPDATE_SYSTEM_RULE: 'UPDATE_SYSTEM_RULE',
  SEND_NOTIFICATION: 'SEND_NOTIFICATION',
  
  // Admin Management
  CREATE_ADMIN: 'CREATE_ADMIN',
  UPDATE_ADMIN: 'UPDATE_ADMIN',
  SUSPEND_ADMIN: 'SUSPEND_ADMIN',
  RESET_ADMIN_PASSWORD: 'RESET_ADMIN_PASSWORD',
};

// Permission Resources
export const PERMISSION_RESOURCES = {
  USERS: 'users',
  DRIVERS: 'drivers',
  PASSENGERS: 'passengers',
  TRIPS: 'trips',
  PAYMENTS: 'payments',
  WALLETS: 'wallets',
  PAYOUTS: 'payouts',
  DISPUTES: 'disputes',
  NOTIFICATIONS: 'notifications',
  SYSTEM_SETTINGS: 'system_settings',
  ADMIN_USERS: 'admin_users',
  AUDIT_LOGS: 'audit_logs',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
};

// Permission Actions
export const PERMISSION_ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  SUSPEND: 'suspend',
  REINSTATE: 'reinstate',
  REFUND: 'refund',
  PAYOUT: 'payout',
  OVERRIDE: 'override',
  CONFIGURE: 'configure',
  EXPORT: 'export',
};

// System Setting Keys
export const SYSTEM_SETTINGS = {
  COMMISSION_PERCENTAGE: 'commission_percentage',
  CANCELLATION_FEE: 'cancellation_fee',
  MAX_DRIVER_DECLINE_COUNT: 'max_driver_decline_count',
  SEARCH_RADIUS_KM: 'search_radius_km',
  MINIMUM_RATING_THRESHOLD: 'minimum_rating_threshold',
  PLATFORM_NAME: 'platform_name',
  PLATFORM_CURRENCY: 'platform_currency',
  SUPPORT_EMAIL: 'support_email',
  SUPPORT_PHONE: 'support_phone',
  AUTO_APPROVE_DRIVERS: 'auto_approve_drivers',
  EMERGENCY_CONTACT_NUMBER: 'emergency_contact_number',
};

// Default System Values
export const DEFAULT_SYSTEM_VALUES = {
  [SYSTEM_SETTINGS.COMMISSION_PERCENTAGE]: '20',
  [SYSTEM_SETTINGS.CANCELLATION_FEE]: '5',
  [SYSTEM_SETTINGS.MAX_DRIVER_DECLINE_COUNT]: '3',
  [SYSTEM_SETTINGS.SEARCH_RADIUS_KM]: '5',
  [SYSTEM_SETTINGS.MINIMUM_RATING_THRESHOLD]: '3.5',
  [SYSTEM_SETTINGS.PLATFORM_NAME]: 'Navo Ride',
  [SYSTEM_SETTINGS.PLATFORM_CURRENCY]: 'USD',
  [SYSTEM_SETTINGS.SUPPORT_EMAIL]: 'support@navoride.com',
  [SYSTEM_SETTINGS.SUPPORT_PHONE]: '+1234567890',
  [SYSTEM_SETTINGS.AUTO_APPROVE_DRIVERS]: 'false',
  [SYSTEM_SETTINGS.EMERGENCY_CONTACT_NUMBER]: '+1234567890',
};