import React from 'react';
import {
  Badge,
  Box,
  HStack,
  Text,
  Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  TimeIcon,
  WarningIcon,
  CloseIcon,
  InfoIcon,
  StarIcon,
  LockIcon,
  UnlockIcon,
  RepeatIcon,
  DownloadIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@chakra-ui/icons';
import {
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaCar,
  FaCarSide,
  FaWalking,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaPauseCircle,
  FaPlayCircle,
  FaStopCircle,
  FaBan,
  FaHourglassHalf,
  FaHourglassStart,
  FaHourglassEnd,
  FaSync,
  FaExchangeAlt,
  FaShieldAlt,
  FaCreditCard,
  FaMoneyBillWave,
  FaExclamationCircle
} from 'react-icons/fa';

const StatusBadge = ({ 
  status, 
  variant = 'solid',
  size = 'md',
  showIcon = true,
  ...props 
}) => {
  // Define all possible statuses and their configurations
  const statusConfigs = {
    // User statuses
    'active': {
      color: 'green',
      icon: <CheckCircleIcon />,
      label: 'Active',
      description: 'Account is active and operational'
    },
    'inactive': {
      color: 'gray',
      icon: <FaUserTimes />,
      label: 'Inactive',
      description: 'Account is inactive'
    },
    'suspended': {
      color: 'red',
      icon: <FaUserTimes />,
      label: 'Suspended',
      description: 'Account has been suspended'
    },
    'pending': {
      color: 'yellow',
      icon: <FaUserClock />,
      label: 'Pending',
      description: 'Awaiting approval or activation'
    },
    'approved': {
      color: 'green',
      icon: <FaUserCheck />,
      label: 'Approved',
      description: 'Approved and ready to use'
    },
    'rejected': {
      color: 'red',
      icon: <CloseIcon />,
      label: 'Rejected',
      description: 'Application has been rejected'
    },
    'verified': {
      color: 'teal',
      icon: <FaShieldAlt />,
      label: 'Verified',
      description: 'Account has been verified'
    },
    'unverified': {
      color: 'orange',
      icon: <FaExclamationCircle />,
      label: 'Unverified',
      description: 'Account requires verification'
    },
    'blocked': {
      color: 'red',
      icon: <FaBan />,
      label: 'Blocked',
      description: 'Account has been blocked'
    },
    
    // Trip statuses
    'requested': {
      color: 'blue',
      icon: <FaClock />,
      label: 'Requested',
      description: 'Trip has been requested'
    },
    'searching': {
      color: 'purple',
      icon: <FaSync />,
      label: 'Searching',
      description: 'Searching for available drivers'
    },
    'driver_assigned': {
      color: 'cyan',
      icon: <FaCar />,
      label: 'Driver Assigned',
      description: 'Driver has been assigned to trip'
    },
    'arriving': {
      color: 'teal',
      icon: <FaMapMarkerAlt />,
      label: 'Arriving',
      description: 'Driver is arriving at pickup location'
    },
    'in_progress': {
      color: 'green',
      icon: <FaCarSide />,
      label: 'In Progress',
      description: 'Trip is currently in progress'
    },
    'completed': {
      color: 'green',
      icon: <FaCheckCircle />,
      label: 'Completed',
      description: 'Trip has been completed'
    },
    'cancelled': {
      color: 'red',
      icon: <FaTimesCircle />,
      label: 'Cancelled',
      description: 'Trip has been cancelled'
    },
    'no_show': {
      color: 'orange',
      icon: <FaExclamationTriangle />,
      label: 'No Show',
      description: 'Passenger or driver did not show up'
    },
    'disputed': {
      color: 'red',
      icon: <FaExclamationTriangle />,
      label: 'Disputed',
      description: 'Trip has a dispute'
    },
    'scheduled': {
      color: 'blue',
      icon: <FaClock />,
      label: 'Scheduled',
      description: 'Trip is scheduled for future'
    },
    
    // Payment statuses
    'pending_payment': {
      color: 'yellow',
      icon: <FaHourglassHalf />,
      label: 'Pending Payment',
      description: 'Payment is pending processing'
    },
    'paid': {
      color: 'green',
      icon: <FaMoneyBillWave />,
      label: 'Paid',
      description: 'Payment has been completed'
    },
    'failed': {
      color: 'red',
      icon: <FaTimesCircle />,
      label: 'Failed',
      description: 'Payment processing failed'
    },
    'refunded': {
      color: 'purple',
      icon: <FaExchangeAlt />,
      label: 'Refunded',
      description: 'Payment has been refunded'
    },
    'partially_refunded': {
      color: 'orange',
      icon: <FaExchangeAlt />,
      label: 'Partially Refunded',
      description: 'Partial refund has been issued'
    },
    'chargeback': {
      color: 'red',
      icon: <FaExclamationTriangle />,
      label: 'Chargeback',
      description: 'Payment has been charged back'
    },
    
    // Payout statuses
    'pending_payout': {
      color: 'yellow',
      icon: <FaHourglassStart />,
      label: 'Pending Payout',
      description: 'Payout is pending processing'
    },
    'processing': {
      color: 'blue',
      icon: <FaSync />,
      label: 'Processing',
      description: 'Payout is being processed'
    },
    'paid_out': {
      color: 'green',
      icon: <FaCheckCircle />,
      label: 'Paid Out',
      description: 'Payout has been completed'
    },
    'failed_payout': {
      color: 'red',
      icon: <FaTimesCircle />,
      label: 'Failed Payout',
      description: 'Payout processing failed'
    },
    'cancelled_payout': {
      color: 'gray',
      icon: <FaTimesCircle />,
      label: 'Cancelled Payout',
      description: 'Payout has been cancelled'
    },
    
    // Emergency statuses
    'open': {
      color: 'red',
      icon: <FaExclamationTriangle />,
      label: 'Open',
      description: 'Emergency is open and needs attention'
    },
    'acknowledged': {
      color: 'orange',
      icon: <FaExclamationCircle />,
      label: 'Acknowledged',
      description: 'Emergency has been acknowledged'
    },
    'investigating': {
      color: 'blue',
      icon: <FaSync />,
      label: 'Investigating',
      description: 'Emergency is being investigated'
    },
    'resolved': {
      color: 'green',
      icon: <FaCheckCircle />,
      label: 'Resolved',
      description: 'Emergency has been resolved'
    },
    'closed': {
      color: 'gray',
      icon: <FaTimesCircle />,
      label: 'Closed',
      description: 'Emergency has been closed'
    },
    'escalated': {
      color: 'purple',
      icon: <FaExclamationTriangle />,
      label: 'Escalated',
      description: 'Emergency has been escalated'
    },
    
    // Document statuses
    'pending_review': {
      color: 'yellow',
      icon: <FaHourglassHalf />,
      label: 'Pending Review',
      description: 'Document is pending review'
    },
    'verified_doc': {
      color: 'green',
      icon: <FaCheckCircle />,
      label: 'Verified',
      description: 'Document has been verified'
    },
    'rejected_doc': {
      color: 'red',
      icon: <FaTimesCircle />,
      label: 'Rejected',
      description: 'Document has been rejected'
    },
    'expired': {
      color: 'orange',
      icon: <FaExclamationCircle />,
      label: 'Expired',
      description: 'Document has expired'
    },
    
    // Vehicle statuses
    'available': {
      color: 'green',
      icon: <FaCar />,
      label: 'Available',
      description: 'Vehicle is available for trips'
    },
    'on_trip': {
      color: 'blue',
      icon: <FaCarSide />,
      label: 'On Trip',
      description: 'Vehicle is currently on a trip'
    },
    'offline': {
      color: 'gray',
      icon: <FaCar />,
      label: 'Offline',
      description: 'Vehicle is offline'
    },
    'maintenance': {
      color: 'orange',
      icon: <FaWrench />,
      label: 'Maintenance',
      description: 'Vehicle is under maintenance'
    },
    
    // Default fallback
    'default': {
      color: 'gray',
      icon: <InfoIcon />,
      label: 'Unknown',
      description: 'Status information not available'
    }
  };

  // Get status configuration
  const statusConfig = statusConfigs[status?.toLowerCase()] || statusConfigs.default;
  
  // Size mappings
  const sizeConfig = {
    xs: { badge: 'xs', icon: '0.5rem', text: 'xs' },
    sm: { badge: 'sm', icon: '0.75rem', text: 'sm' },
    md: { badge: 'md', icon: '1rem', text: 'md' },
    lg: { badge: 'lg', icon: '1.25rem', text: 'lg' }
  };
  
  const currentSize = sizeConfig[size] || sizeConfig.md;

  return (
    <Tooltip label={statusConfig.description} placement="top" hasArrow>
      <Badge
        colorScheme={statusConfig.color}
        variant={variant}
        fontSize={currentSize.text}
        px={3}
        py={1}
        borderRadius="md"
        display="inline-flex"
        alignItems="center"
        gap={2}
        {...props}
      >
        {showIcon && (
          <Box fontSize={currentSize.icon}>
            {statusConfig.icon}
          </Box>
        )}
        <Text fontWeight="medium">
          {statusConfig.label}
        </Text>
      </Badge>
    </Tooltip>
  );
};

export default StatusBadge;