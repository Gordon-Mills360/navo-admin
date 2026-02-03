/**
 * State machine logic for entity transitions in the Navo Admin System
 */

// Driver state transitions
export const getNextDriverState = (currentState, action) => {
  const stateMachine = {
    pending: {
      verify: 'verified',
      reject: 'rejected',
      suspend: 'suspended'
    },
    verified: {
      activate: 'active',
      suspend: 'suspended',
      deactivate: 'inactive'
    },
    active: {
      suspend: 'suspended',
      deactivate: 'inactive',
      make_online: 'online',
      make_offline: 'offline'
    },
    online: {
      make_offline: 'offline',
      assign_trip: 'busy',
      suspend: 'suspended'
    },
    offline: {
      make_online: 'online',
      suspend: 'suspended',
      deactivate: 'inactive'
    },
    busy: {
      complete_trip: 'online',
      cancel_trip: 'online',
      suspend: 'suspended'
    },
    suspended: {
      activate: 'active',
      deactivate: 'inactive',
      delete: 'deleted'
    },
    inactive: {
      activate: 'active',
      delete: 'deleted'
    },
    rejected: {
      delete: 'deleted'
    },
    deleted: {
      restore: 'inactive'
    }
  };

  return stateMachine[currentState]?.[action] || null;
};

// Passenger state transitions
export const getNextPassengerState = (currentState, action) => {
  const stateMachine = {
    pending: {
      verify: 'active',
      reject: 'rejected'
    },
    active: {
      suspend: 'suspended',
      deactivate: 'inactive'
    },
    suspended: {
      activate: 'active',
      deactivate: 'inactive',
      delete: 'deleted'
    },
    inactive: {
      activate: 'active',
      delete: 'deleted'
    },
    rejected: {
      delete: 'deleted'
    },
    deleted: {
      restore: 'inactive'
    }
  };

  return stateMachine[currentState]?.[action] || null;
};

// Trip state transitions
export const getNextTripState = (currentState, action) => {
  const stateMachine = {
    requested: {
      assign_driver: 'searching',
      cancel: 'cancelled',
      timeout: 'expired'
    },
    searching: {
      accept: 'accepted',
      reject: 'rejected',
      cancel: 'cancelled',
      timeout: 'expired'
    },
    accepted: {
      arrive: 'arrived',
      cancel: 'cancelled',
      no_show: 'no_show'
    },
    arrived: {
      start: 'in_progress',
      cancel: 'cancelled',
      no_show: 'no_show'
    },
    in_progress: {
      complete: 'completed',
      cancel: 'cancelled',
      emergency: 'emergency'
    },
    completed: {
      // Terminal state
      dispute: 'disputed',
      refund: 'refunded'
    },
    cancelled: {
      // Terminal state
      refund: 'refunded'
    },
    rejected: {
      // Terminal state
    },
    expired: {
      // Terminal state
    },
    no_show: {
      // Terminal state
      charge: 'charged'
    },
    emergency: {
      resolve: 'completed',
      cancel: 'cancelled'
    },
    disputed: {
      resolve: 'completed',
      refund: 'refunded'
    },
    refunded: {
      // Terminal state
    },
    charged: {
      // Terminal state
    }
  };

  return stateMachine[currentState]?.[action] || null;
};

// Payment state transitions
export const getNextPaymentState = (currentState, action) => {
  const stateMachine = {
    pending: {
      process: 'processing',
      cancel: 'cancelled',
      fail: 'failed'
    },
    processing: {
      complete: 'completed',
      fail: 'failed'
    },
    completed: {
      refund: 'refunded',
      dispute: 'disputed'
    },
    failed: {
      retry: 'pending',
      cancel: 'cancelled'
    },
    cancelled: {
      // Terminal state
    },
    refunded: {
      // Terminal state
    },
    disputed: {
      resolve: 'completed',
      refund: 'refunded'
    }
  };

  return stateMachine[currentState]?.[action] || null;
};

// Emergency state transitions
export const getNextEmergencyState = (currentState, action) => {
  const stateMachine = {
    pending: {
      acknowledge: 'acknowledged',
      resolve: 'resolved',
      escalate: 'escalated'
    },
    acknowledged: {
      dispatch: 'dispatched',
      resolve: 'resolved',
      escalate: 'escalated'
    },
    dispatched: {
      on_site: 'on_site',
      resolve: 'resolved'
    },
    on_site: {
      resolve: 'resolved',
      escalate: 'escalated'
    },
    escalated: {
      resolve: 'resolved'
    },
    resolved: {
      // Terminal state
      reopen: 'pending'
    }
  };

  return stateMachine[currentState]?.[action] || null;
};

// Document state transitions
export const getNextDocumentState = (currentState, action) => {
  const stateMachine = {
    pending: {
      verify: 'verified',
      reject: 'rejected',
      request_revision: 'revision_requested'
    },
    revision_requested: {
      resubmit: 'pending',
      reject: 'rejected'
    },
    verified: {
      expire: 'expired',
      revoke: 'revoked'
    },
    rejected: {
      // Terminal state
      resubmit: 'pending'
    },
    expired: {
      renew: 'pending',
      revoke: 'revoked'
    },
    revoked: {
      // Terminal state
      renew: 'pending'
    }
  };

  return stateMachine[currentState]?.[action] || null;
};

// Vehicle state transitions
export const getNextVehicleState = (currentState, action) => {
  const stateMachine = {
    pending: {
      approve: 'approved',
      reject: 'rejected',
      request_info: 'info_requested'
    },
    info_requested: {
      submit_info: 'pending',
      reject: 'rejected'
    },
    approved: {
      suspend: 'suspended',
      deactivate: 'inactive'
    },
    active: {
      suspend: 'suspended',
      deactivate: 'inactive',
      maintenance: 'under_maintenance'
    },
    under_maintenance: {
      complete_maintenance: 'active',
      suspend: 'suspended'
    },
    suspended: {
      activate: 'active',
      deactivate: 'inactive'
    },
    inactive: {
      activate: 'active'
    },
    rejected: {
      // Terminal state
      resubmit: 'pending'
    }
  };

  return stateMachine[currentState]?.[action] || null;
};

// Wallet state transitions
export const getNextWalletState = (currentState, action) => {
  const stateMachine = {
    active: {
      suspend: 'suspended',
      freeze: 'frozen'
    },
    suspended: {
      activate: 'active',
      freeze: 'frozen'
    },
    frozen: {
      activate: 'active',
      suspend: 'suspended'
    },
    closed: {
      // Terminal state
      reopen: 'active'
    }
  };

  return stateMachine[currentState]?.[action] || null;
};

// Check if transition is allowed
export const canTransition = (currentState, nextState, entityType) => {
  const transitionMap = {
    driver: getNextDriverState,
    passenger: getNextPassengerState,
    trip: getNextTripState,
    payment: getNextPaymentState,
    emergency: getNextEmergencyState,
    document: getNextDocumentState,
    vehicle: getNextVehicleState,
    wallet: getNextWalletState
  };

  const stateMachine = transitionMap[entityType];
  if (!stateMachine) return false;

  // Get all possible next states from current state
  const possibleStates = [];
  const actions = Object.keys(stateMachine(currentState, '') || {});
  
  for (const action of actions) {
    const next = stateMachine(currentState, action);
    if (next) {
      possibleStates.push(next);
    }
  }

  return possibleStates.includes(nextState);
};

// Get allowed actions for current state
export const getAllowedActions = (state, entityType) => {
  const transitionMap = {
    driver: getNextDriverState,
    passenger: getNextPassengerState,
    trip: getNextTripState,
    payment: getNextPaymentState,
    emergency: getNextEmergencyState,
    document: getNextDocumentState,
    vehicle: getNextVehicleState,
    wallet: getNextWalletState
  };

  const stateMachine = transitionMap[entityType];
  if (!stateMachine) return [];

  // Get all actions that have a valid transition from current state
  const allowedActions = [];
  const actions = Object.keys(stateMachine(state, '') || {});
  
  for (const action of actions) {
    const nextState = stateMachine(state, action);
    if (nextState) {
      allowedActions.push({
        action,
        nextState,
        label: formatActionLabel(action, entityType)
      });
    }
  }

  return allowedActions;
};

// Validate state transition
export const validateStateTransition = (currentState, nextState, entityType) => {
  const isValid = canTransition(currentState, nextState, entityType);
  
  if (!isValid) {
    const allowedActions = getAllowedActions(currentState, entityType);
    const allowedStates = allowedActions.map(a => a.nextState);
    
    return {
      isValid: false,
      error: `Cannot transition from ${currentState} to ${nextState} for ${entityType}. Allowed states: ${allowedStates.join(', ')}`
    };
  }

  return { isValid: true, error: null };
};

// Get human-readable state description
export const getStateDescription = (state, entityType) => {
  const descriptions = {
    driver: {
      pending: 'Driver application pending verification',
      verified: 'Driver verified, awaiting activation',
      active: 'Driver is active and can accept trips',
      online: 'Driver is online and available for trips',
      offline: 'Driver is offline and not accepting trips',
      busy: 'Driver is currently on a trip',
      suspended: 'Driver account suspended',
      inactive: 'Driver account inactive',
      rejected: 'Driver application rejected',
      deleted: 'Driver account deleted'
    },
    passenger: {
      pending: 'Passenger account pending verification',
      active: 'Passenger account active',
      suspended: 'Passenger account suspended',
      inactive: 'Passenger account inactive',
      rejected: 'Passenger account rejected',
      deleted: 'Passenger account deleted'
    },
    trip: {
      requested: 'Trip requested by passenger',
      searching: 'Searching for available driver',
      accepted: 'Trip accepted by driver',
      arrived: 'Driver arrived at pickup location',
      'in_progress': 'Trip in progress',
      completed: 'Trip completed successfully',
      cancelled: 'Trip cancelled',
      rejected: 'Trip rejected by driver',
      expired: 'Trip request expired',
      'no_show': 'Passenger no-show',
      emergency: 'Emergency situation reported',
      disputed: 'Trip under dispute',
      refunded: 'Trip refunded',
      charged: 'No-show fee charged'
    },
    payment: {
      pending: 'Payment pending',
      processing: 'Payment being processed',
      completed: 'Payment completed successfully',
      failed: 'Payment failed',
      cancelled: 'Payment cancelled',
      refunded: 'Payment refunded',
      disputed: 'Payment under dispute'
    },
    emergency: {
      pending: 'Emergency reported, awaiting response',
      acknowledged: 'Emergency acknowledged by admin',
      dispatched: 'Help dispatched to location',
      on_site: 'Help arrived on site',
      escalated: 'Emergency escalated to higher authority',
      resolved: 'Emergency resolved'
    },
    document: {
      pending: 'Document pending verification',
      'revision_requested': 'Document revision requested',
      verified: 'Document verified and approved',
      rejected: 'Document rejected',
      expired: 'Document expired',
      revoked: 'Document revoked'
    },
    vehicle: {
      pending: 'Vehicle pending approval',
      'info_requested': 'Additional vehicle information requested',
      approved: 'Vehicle approved',
      active: 'Vehicle active and available',
      'under_maintenance': 'Vehicle under maintenance',
      suspended: 'Vehicle suspended',
      inactive: 'Vehicle inactive',
      rejected: 'Vehicle registration rejected'
    },
    wallet: {
      active: 'Wallet active',
      suspended: 'Wallet suspended',
      frozen: 'Wallet frozen',
      closed: 'Wallet closed'
    }
  };

  return descriptions[entityType]?.[state] || state;
};

// Get color for state badge
export const getStateColor = (state, entityType) => {
  const colorMap = {
    // Positive states
    active: 'green',
    online: 'green',
    verified: 'green',
    approved: 'green',
    completed: 'green',
    resolved: 'green',
    
    // Neutral states
    pending: 'yellow',
    searching: 'yellow',
    processing: 'yellow',
    acknowledged: 'yellow',
    'revision_requested': 'yellow',
    'info_requested': 'yellow',
    'under_maintenance': 'yellow',
    
    // Warning states
    suspended: 'orange',
    inactive: 'orange',
    'no_show': 'orange',
    expired: 'orange',
    disputed: 'orange',
    
    // Negative states
    rejected: 'red',
    cancelled: 'red',
    failed: 'red',
    emergency: 'red',
    revoked: 'red',
    deleted: 'red',
    
    // Info states
    requested: 'blue',
    accepted: 'blue',
    arrived: 'blue',
    'in_progress': 'blue',
    dispatched: 'blue',
    'on_site': 'blue',
    escalated: 'blue',
    refunded: 'blue',
    charged: 'blue',
    closed: 'gray',
    busy: 'purple',
    frozen: 'purple',
    offline: 'gray'
  };

  return colorMap[state] || 'gray';
};

// Get icon for state
export const getStateIcon = (state, entityType) => {
  const iconMap = {
    active: 'check-circle',
    online: 'wifi',
    verified: 'check',
    approved: 'check',
    completed: 'check',
    resolved: 'check',
    
    pending: 'clock',
    searching: 'search',
    processing: 'sync',
    acknowledged: 'eye',
    
    suspended: 'ban',
    inactive: 'minus-circle',
    rejected: 'x-circle',
    cancelled: 'x',
    failed: 'x-circle',
    
    requested: 'plus',
    accepted: 'check-circle',
    arrived: 'map-pin',
    'in_progress': 'navigation',
    
    emergency: 'alert-triangle',
    disputed: 'alert-circle',
    refunded: 'refresh-cw',
    
    expired: 'calendar',
    revoked: 'shield-off',
    deleted: 'trash-2',
    
    busy: 'loader',
    offline: 'wifi-off',
    frozen: 'snowflake'
  };

  return iconMap[state] || 'circle';
};

// Format action label for display
export const formatActionLabel = (action, entityType) => {
  const labels = {
    verify: 'Verify',
    activate: 'Activate',
    deactivate: 'Deactivate',
    suspend: 'Suspend',
    delete: 'Delete',
    restore: 'Restore',
    reject: 'Reject',
    'make_online': 'Go Online',
    'make_offline': 'Go Offline',
    'assign_trip': 'Assign Trip',
    'complete_trip': 'Complete Trip',
    'cancel_trip': 'Cancel Trip',
    
    'assign_driver': 'Assign Driver',
    accept: 'Accept',
    arrive: 'Mark as Arrived',
    start: 'Start Trip',
    complete: 'Complete Trip',
    cancel: 'Cancel',
    timeout: 'Mark as Expired',
    'no_show': 'Mark as No-Show',
    emergency: 'Report Emergency',
    dispute: 'Dispute',
    refund: 'Refund',
    charge: 'Charge Fee',
    resolve: 'Resolve',
    reopen: 'Re-open',
    
    process: 'Process',
    retry: 'Retry',
    
    acknowledge: 'Acknowledge',
    dispatch: 'Dispatch Help',
    'on_site': 'Mark as On Site',
    escalate: 'Escalate',
    
    'request_revision': 'Request Revision',
    resubmit: 'Resubmit',
    expire: 'Mark as Expired',
    revoke: 'Revoke',
    renew: 'Renew',
    
    approve: 'Approve',
    'request_info': 'Request Info',
    'submit_info': 'Submit Info',
    maintenance: 'Send for Maintenance',
    'complete_maintenance': 'Complete Maintenance',
    
    freeze: 'Freeze',
    close: 'Close'
  };

  return labels[action] || action.replace(/_/g, ' ');
};

// Get state flow for visualization
export const getStateFlow = (entityType) => {
  const flows = {
    driver: [
      { state: 'pending', type: 'start' },
      { state: 'verified', type: 'intermediate' },
      { state: 'active', type: 'intermediate' },
      { state: 'online', type: 'intermediate' },
      { state: 'busy', type: 'intermediate' },
      { state: 'offline', type: 'intermediate' },
      { state: 'suspended', type: 'intermediate' },
      { state: 'inactive', type: 'intermediate' },
      { state: 'rejected', type: 'end' },
      { state: 'deleted', type: 'end' }
    ],
    passenger: [
      { state: 'pending', type: 'start' },
      { state: 'active', type: 'intermediate' },
      { state: 'suspended', type: 'intermediate' },
      { state: 'inactive', type: 'intermediate' },
      { state: 'rejected', type: 'end' },
      { state: 'deleted', type: 'end' }
    ],
    trip: [
      { state: 'requested', type: 'start' },
      { state: 'searching', type: 'intermediate' },
      { state: 'accepted', type: 'intermediate' },
      { state: 'arrived', type: 'intermediate' },
      { state: 'in_progress', type: 'intermediate' },
      { state: 'completed', type: 'end' },
      { state: 'cancelled', type: 'end' },
      { state: 'rejected', type: 'end' },
      { state: 'expired', type: 'end' },
      { state: 'no_show', type: 'end' },
      { state: 'emergency', type: 'intermediate' },
      { state: 'disputed', type: 'intermediate' },
      { state: 'refunded', type: 'end' },
      { state: 'charged', type: 'end' }
    ],
    payment: [
      { state: 'pending', type: 'start' },
      { state: 'processing', type: 'intermediate' },
      { state: 'completed', type: 'end' },
      { state: 'failed', type: 'intermediate' },
      { state: 'cancelled', type: 'end' },
      { state: 'refunded', type: 'end' },
      { state: 'disputed', type: 'intermediate' }
    ]
  };

  return flows[entityType] || [];
};

// Get state statistics
export const getStateStatistics = (entities, entityType) => {
  const stats = {
    total: entities.length,
    byState: {},
    percentages: {}
  };

  // Count by state
  entities.forEach(entity => {
    const state = entity.status || entity.state;
    stats.byState[state] = (stats.byState[state] || 0) + 1;
  });

  // Calculate percentages
  Object.keys(stats.byState).forEach(state => {
    stats.percentages[state] = (stats.byState[state] / stats.total * 100).toFixed(1);
  });

  return stats;
};

// Check if state is terminal (no further transitions)
export const isTerminalState = (state, entityType) => {
  const terminalStates = {
    driver: ['rejected', 'deleted'],
    passenger: ['rejected', 'deleted'],
    trip: ['completed', 'cancelled', 'rejected', 'expired', 'no_show', 'refunded', 'charged'],
    payment: ['completed', 'cancelled', 'refunded'],
    emergency: ['resolved'],
    document: ['rejected', 'revoked'],
    vehicle: ['rejected'],
    wallet: ['closed']
  };

  return terminalStates[entityType]?.includes(state) || false;
};

// Get recommended next action based on state and context
export const getRecommendedAction = (state, entityType, context = {}) => {
  const recommendations = {
    driver: {
      pending: 'verify',
      verified: 'activate',
      suspended: 'activate',
      inactive: 'activate',
      online: 'assign_trip',
      busy: 'complete_trip'
    },
    passenger: {
      pending: 'verify',
      suspended: 'activate',
      inactive: 'activate'
    },
    trip: {
      requested: 'assign_driver',
      searching: 'accept',
      accepted: 'arrive',
      arrived: 'start',
      'in_progress': 'complete',
      emergency: 'resolve',
      disputed: 'resolve'
    },
    payment: {
      pending: 'process',
      processing: 'complete',
      failed: 'retry'
    },
    emergency: {
      pending: 'acknowledge',
      acknowledged: 'dispatch',
      dispatched: 'on_site',
      'on_site': 'resolve'
    },
    document: {
      pending: 'verify',
      'revision_requested': 'verify',
      expired: 'renew'
    }
  };

  return recommendations[entityType]?.[state] || null;
};

// Batch state transition validation
export const validateBatchTransition = (entities, nextState, entityType) => {
  const results = {
    valid: [],
    invalid: [],
    errors: []
  };

  entities.forEach(entity => {
    const currentState = entity.status || entity.state;
    const validation = validateStateTransition(currentState, nextState, entityType);
    
    if (validation.isValid) {
      results.valid.push(entity);
    } else {
      results.invalid.push(entity);
      results.errors.push({
        id: entity.id,
        error: validation.error
      });
    }
  });

  return results;
};

// Get transition history for an entity
export const getTransitionHistory = (transitions, entityType) => {
  return transitions.map(transition => ({
    ...transition,
    fromLabel: getStateDescription(transition.fromState, entityType),
    toLabel: getStateDescription(transition.toState, entityType),
    actionLabel: formatActionLabel(transition.action, entityType),
    fromColor: getStateColor(transition.fromState, entityType),
    toColor: getStateColor(transition.toState, entityType)
  }));
};

export default {
  getNextDriverState,
  getNextPassengerState,
  getNextTripState,
  getNextPaymentState,
  getNextEmergencyState,
  getNextDocumentState,
  getNextVehicleState,
  getNextWalletState,
  canTransition,
  getAllowedActions,
  validateStateTransition,
  getStateDescription,
  getStateColor,
  getStateIcon,
  formatActionLabel,
  getStateFlow,
  getStateStatistics,
  isTerminalState,
  getRecommendedAction,
  validateBatchTransition,
  getTransitionHistory
};