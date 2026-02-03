/**
 * Data formatting utilities for the Navo Admin System
 */

// Currency formatting
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined) return 'N/A';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return 'Invalid amount';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
};

// Date/time formatting
export const formatDate = (date, format = 'date', locale = 'en-US') => {
  if (!date) return 'N/A';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffMs = now - dateObj;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  switch (format) {
    case 'date':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
    case 'time':
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
    case 'datetime':
      return dateObj.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
    case 'relative':
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          if (diffMinutes === 0) {
            return 'Just now';
          }
          return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
        }
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
      }
      return dateObj.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric'
      });
      
    case 'full':
      return dateObj.toLocaleString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      });
      
    case 'short':
      return dateObj.toLocaleDateString(locale, {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit'
      });
      
    case 'iso':
      return dateObj.toISOString();
      
    case 'timeago':
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const diffSec = Math.floor((now - dateObj) / 1000);
      
      if (diffSec < 60) return rtf.format(-diffSec, 'second');
      if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), 'minute');
      if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), 'hour');
      if (diffSec < 604800) return rtf.format(-Math.floor(diffSec / 86400), 'day');
      if (diffSec < 2592000) return rtf.format(-Math.floor(diffSec / 604800), 'week');
      if (diffSec < 31536000) return rtf.format(-Math.floor(diffSec / 2592000), 'month');
      return rtf.format(-Math.floor(diffSec / 31536000), 'year');
      
    default:
      return dateObj.toLocaleDateString(locale);
  }
};

// Phone number formatting
export const formatPhone = (phoneNumber, countryCode = 'US') => {
  if (!phoneNumber) return 'N/A';
  
  const phone = phoneNumber.toString().replace(/\D/g, '');
  
  if (phone.length === 10) {
    // US format: (123) 456-7890
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  } else if (phone.length === 11 && phone.startsWith('1')) {
    // US with country code: +1 (123) 456-7890
    return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`;
  } else if (phone.length > 0) {
    // International format
    return `+${phone}`;
  }
  
  return phoneNumber;
};

// Text truncation
export const truncateText = (text, length = 100, suffix = '...') => {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.substring(0, length).trim() + suffix;
};

// File size formatting
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Duration formatting
export const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return 'N/A';
  
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

// Duration formatting for display (more user-friendly)
export const formatDurationDisplay = (seconds) => {
  if (!seconds && seconds !== 0) return 'N/A';
  
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes} min`;
  } else {
    return '< 1 min';
  }
};

// Percentage formatting
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return 'N/A';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'Invalid';
  
  return `${numValue.toFixed(decimals)}%`;
};

// Number formatting
export const formatNumber = (number, decimals = 0, locale = 'en-US') => {
  if (number === null || number === undefined) return 'N/A';
  
  const num = typeof number === 'string' ? parseFloat(number) : number;
  
  if (isNaN(num)) return 'Invalid';
  
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

// Address formatting
export const formatAddress = (address) => {
  if (!address) return 'N/A';
  
  if (typeof address === 'string') {
    return address;
  }
  
  // Handle address object
  const parts = [];
  
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postal_code) parts.push(address.postal_code);
  if (address.country) parts.push(address.country);
  
  return parts.join(', ');
};

// License plate formatting
export const formatLicensePlate = (plate, country = 'US') => {
  if (!plate) return 'N/A';
  
  const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  if (country === 'US') {
    // Common US format: ABC-1234
    if (cleanPlate.length >= 7) {
      return `${cleanPlate.slice(0, 3)}-${cleanPlate.slice(3)}`;
    }
  }
  
  return cleanPlate;
};

// Rating formatting
export const formatRating = (rating, max = 5, showEmpty = true) => {
  if (rating === null || rating === undefined) {
    return showEmpty ? 'Not rated' : '';
  }
  
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  
  if (isNaN(numRating)) return 'Invalid';
  
  return `${numRating.toFixed(1)}/${max}`;
};

// Coordinate formatting
export const formatCoordinates = (lat, lng, precision = 6) => {
  if (lat === null || lng === null || lat === undefined || lng === undefined) {
    return 'N/A';
  }
  
  const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  if (isNaN(numLat) || isNaN(numLng)) return 'Invalid coordinates';
  
  const latDir = numLat >= 0 ? 'N' : 'S';
  const lngDir = numLng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(numLat).toFixed(precision)}°${latDir}, ${Math.abs(numLng).toFixed(precision)}°${lngDir}`;
};

// Status formatting with colors
export const formatStatus = (status, entityType = 'general') => {
  const statusMap = {
    // General statuses
    active: { label: 'Active', color: 'green' },
    inactive: { label: 'Inactive', color: 'gray' },
    pending: { label: 'Pending', color: 'yellow' },
    approved: { label: 'Approved', color: 'green' },
    rejected: { label: 'Rejected', color: 'red' },
    suspended: { label: 'Suspended', color: 'orange' },
    deleted: { label: 'Deleted', color: 'red' },
    
    // Trip statuses
    requested: { label: 'Requested', color: 'blue' },
    searching: { label: 'Searching', color: 'blue' },
    accepted: { label: 'Accepted', color: 'green' },
    arrived: { label: 'Arrived', color: 'teal' },
    'in_progress': { label: 'In Progress', color: 'purple' },
    completed: { label: 'Completed', color: 'green' },
    cancelled: { label: 'Cancelled', color: 'red' },
    'no_show': { label: 'No Show', color: 'orange' },
    
    // Payment statuses
    paid: { label: 'Paid', color: 'green' },
    unpaid: { label: 'Unpaid', color: 'yellow' },
    refunded: { label: 'Refunded', color: 'blue' },
    failed: { label: 'Failed', color: 'red' },
    processing: { label: 'Processing', color: 'yellow' },
    
    // Driver statuses
    online: { label: 'Online', color: 'green' },
    offline: { label: 'Offline', color: 'gray' },
    busy: { label: 'Busy', color: 'purple' },
    
    // Emergency statuses
    emergency: { label: 'Emergency', color: 'red' },
    resolved: { label: 'Resolved', color: 'green' },
    investigating: { label: 'Investigating', color: 'yellow' },
    
    // Document statuses
    verified: { label: 'Verified', color: 'green' },
    'under_review': { label: 'Under Review', color: 'yellow' },
    expired: { label: 'Expired', color: 'orange' }
  };
  
  const formatted = statusMap[status] || { 
    label: status.charAt(0).toUpperCase() + status.slice(1), 
    color: 'gray' 
  };
  
  return {
    ...formatted,
    original: status
  };
};

// Distance formatting
export const formatDistance = (meters, unit = 'auto') => {
  if (meters === null || meters === undefined) return 'N/A';
  
  const numMeters = typeof meters === 'string' ? parseFloat(meters) : meters;
  
  if (isNaN(numMeters)) return 'Invalid';
  
  if (unit === 'km' || (unit === 'auto' && numMeters >= 1000)) {
    const km = numMeters / 1000;
    return `${km.toFixed(1)} km`;
  } else {
    return `${Math.round(numMeters)} m`;
  }
};

// Speed formatting
export const formatSpeed = (metersPerSecond, unit = 'kmh') => {
  if (metersPerSecond === null || metersPerSecond === undefined) return 'N/A';
  
  const mps = typeof metersPerSecond === 'string' ? parseFloat(metersPerSecond) : metersPerSecond;
  
  if (isNaN(mps)) return 'Invalid';
  
  if (unit === 'kmh') {
    const kmh = mps * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  } else if (unit === 'mph') {
    const mph = mps * 2.23694;
    return `${mph.toFixed(1)} mph`;
  } else {
    return `${mps.toFixed(1)} m/s`;
  }
};

// Format array to comma-separated string
export const formatArray = (array, maxItems = 3, separator = ', ') => {
  if (!Array.isArray(array) || array.length === 0) return 'None';
  
  if (array.length <= maxItems) {
    return array.join(separator);
  }
  
  return `${array.slice(0, maxItems).join(separator)} and ${array.length - maxItems} more`;
};

// Format boolean to Yes/No
export const formatBoolean = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return value ? 'Yes' : 'No';
};

// Format time range
export const formatTimeRange = (start, end, format = 'time') => {
  if (!start || !end) return 'N/A';
  
  const startFormatted = formatDate(start, format);
  const endFormatted = formatDate(end, format);
  
  return `${startFormatted} - ${endFormatted}`;
};

// Format wallet balance with currency
export const formatWalletBalance = (balance, currency = 'USD') => {
  return formatCurrency(balance, currency);
};

// Format commission amount
export const formatCommission = (amount, tripAmount, currency = 'USD') => {
  const formattedAmount = formatCurrency(amount, currency);
  const percentage = tripAmount > 0 ? (amount / tripAmount * 100).toFixed(1) : '0';
  
  return `${formattedAmount} (${percentage}%)`;
};

// Format driver earning
export const formatDriverEarning = (earning, tripAmount, currency = 'USD') => {
  const formattedEarning = formatCurrency(earning, currency);
  const percentage = tripAmount > 0 ? (earning / tripAmount * 100).toFixed(1) : '0';
  
  return `${formattedEarning} (${percentage}%)`;
};

// Format timestamp for log display
export const formatTimestamp = (timestamp, showMs = false) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) return 'Invalid timestamp';
  
  const timeString = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  if (showMs) {
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${timeString}.${ms}`;
  }
  
  return timeString;
};

// Format error message for display
export const formatErrorMessage = (error) => {
  if (!error) return 'Unknown error';
  
  if (typeof error === 'string') return error;
  
  if (error.message) {
    // Remove technical details for user display
    const message = error.message.split('\n')[0];
    return message.charAt(0).toUpperCase() + message.slice(1);
  }
  
  return JSON.stringify(error);
};

// Format object for display (truncates large objects)
export const formatObject = (obj, maxDepth = 2, currentDepth = 0) => {
  if (currentDepth >= maxDepth) {
    return '...';
  }
  
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  
  if (typeof obj !== 'object') {
    return String(obj);
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    if (obj.length > 3) return `[${obj.slice(0, 3).map(item => formatObject(item, maxDepth, currentDepth + 1)).join(', ')}...]`;
    return `[${obj.map(item => formatObject(item, maxDepth, currentDepth + 1)).join(', ')}]`;
  }
  
  const entries = Object.entries(obj);
  if (entries.length === 0) return '{}';
  
  if (entries.length > 5) {
    return `{${entries.slice(0, 3).map(([key, value]) => `${key}: ${formatObject(value, maxDepth, currentDepth + 1)}`).join(', ')}...}`;
  }
  
  return `{${entries.map(([key, value]) => `${key}: ${formatObject(value, maxDepth, currentDepth + 1)}`).join(', ')}}`;
};

export default {
  formatCurrency,
  formatDate,
  formatPhone,
  truncateText,
  formatBytes,
  formatDuration,
  formatDurationDisplay,
  formatPercentage,
  formatNumber,
  formatAddress,
  formatLicensePlate,
  formatRating,
  formatCoordinates,
  formatStatus,
  formatDistance,
  formatSpeed,
  formatArray,
  formatBoolean,
  formatTimeRange,
  formatWalletBalance,
  formatCommission,
  formatDriverEarning,
  formatTimestamp,
  formatErrorMessage,
  formatObject
};