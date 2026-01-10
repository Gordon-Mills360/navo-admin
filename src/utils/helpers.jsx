/**
 * Format currency with local settings
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount == null || isNaN(amount)) {
    amount = 0;
  }
  
  // Special handling for Ghanaian Cedis
  if (currency === 'GHS') {
    return `₵${parseFloat(amount).toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = true) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Accra', // Ghana timezone
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Get color class based on status (for Chakra UI)
 * @param {string} status - Status string
 * @returns {object} Chakra UI color scheme
 */
export const getStatusColor = (status) => {
  const statusColors = {
    // Ride statuses
    'requested': { color: 'yellow', scheme: 'yellow' },
    'accepted': { color: 'blue', scheme: 'blue' },
    'ongoing': { color: 'indigo', scheme: 'indigo' },
    'completed': { color: 'green', scheme: 'green' },
    'cancelled': { color: 'red', scheme: 'red' },
    
    // Driver statuses
    'pending': { color: 'yellow', scheme: 'yellow' },
    'approved': { color: 'green', scheme: 'green' },
    'rejected': { color: 'red', scheme: 'red' },
    'suspended': { color: 'gray', scheme: 'gray' },
    
    // Payment statuses
    'paid': { color: 'green', scheme: 'green' },
    'success': { color: 'green', scheme: 'green' },
    'failed': { color: 'red', scheme: 'red' },
    'refunded': { color: 'purple', scheme: 'purple' },
    'disputed': { color: 'orange', scheme: 'orange' },
  };
  
  return statusColors[status] || { color: 'gray', scheme: 'gray' };
};

/**
 * Get color class based on status (for Chakra UI Badge)
 * @param {string} status - Status string
 * @returns {string} Chakra UI color scheme
 */
export const getStatusColorScheme = (status) => {
  return getStatusColor(status).scheme;
};

/**
 * Get background and text colors for status
 * @param {string} status - Status string
 * @returns {object} Object with bg and color properties
 */
export const getStatusStyle = (status) => {
  const colorMap = {
    'requested': { bg: 'yellow.100', color: 'yellow.800' },
    'accepted': { bg: 'blue.100', color: 'blue.800' },
    'ongoing': { bg: 'indigo.100', color: 'indigo.800' },
    'completed': { bg: 'green.100', color: 'green.800' },
    'cancelled': { bg: 'red.100', color: 'red.800' },
    'pending': { bg: 'yellow.100', color: 'yellow.800' },
    'approved': { bg: 'green.100', color: 'green.800' },
    'rejected': { bg: 'red.100', color: 'red.800' },
    'suspended': { bg: 'gray.100', color: 'gray.800' },
    'paid': { bg: 'green.100', color: 'green.800' },
    'success': { bg: 'green.100', color: 'green.800' },
    'failed': { bg: 'red.100', color: 'red.800' },
    'refunded': { bg: 'purple.100', color: 'purple.800' },
    'disputed': { bg: 'orange.100', color: 'orange.800' },
  };
  
  return colorMap[status] || { bg: 'gray.100', color: 'gray.800' };
};

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
export const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  const percentage = (part / total) * 100;
  return parseFloat(percentage.toFixed(2)); // Return with 2 decimal places
};

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (num == null || isNaN(num)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get time ago string
 * @param {string|Date} date - Date to compare
 * @returns {string} Time ago string
 */
export const getTimeAgo = (date) => {
  if (!date) return 'N/A';
  
  const now = new Date();
  const past = new Date(date);
  
  // Check if date is valid
  if (isNaN(past.getTime())) {
    return 'Invalid date';
  }
  
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(date, false);
};

/**
 * Format distance in kilometers
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance == null || isNaN(distance)) {
    return 'N/A';
  }
  return `${parseFloat(distance).toFixed(1)} km`;
};

/**
 * Format duration in minutes
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (minutes) => {
  if (minutes == null || isNaN(minutes)) {
    return 'N/A';
  }
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Safe parse float with default value
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed float or default value
 */
export const safeParseFloat = (value, defaultValue = 0) => {
  if (value == null || value === '') {
    return defaultValue;
  }
  
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]+/g, '')) 
    : Number(value);
    
  return isNaN(num) ? defaultValue : num;
};

/**
 * Generate random ID
 * @param {number} length - Length of ID
 * @returns {string} Random ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Format phone number for Ghana
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return 'N/A';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's a Ghanaian number
  if (digits.length === 10 && digits.startsWith('0')) {
    return `+233 ${digits.substring(1, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }
  
  // Return as is for international numbers
  return phone;
};