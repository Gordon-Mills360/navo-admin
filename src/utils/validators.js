/**
 * Form validation utilities for the Navo Admin System
 */

// Email validation
export const validateEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Phone validation (basic international format)
export const validatePhone = (phone) => {
  if (!phone) return false;
  
  // Remove all non-digit characters except leading plus
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check if it's a valid phone number
  // Minimum 10 digits for most countries, maximum 15
  const digits = cleaned.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

// Password validation
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecial = true
  } = options;
  
  if (!password) return { isValid: false, errors: ['Password is required'] };
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Monetary amount validation
export const validateAmount = (amount, options = {}) => {
  const {
    min = 0,
    max = 1000000,
    allowZero = true,
    allowNegative = false
  } = options;
  
  if (amount === null || amount === undefined || amount === '') {
    return { isValid: false, error: 'Amount is required' };
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }
  
  if (!allowNegative && numAmount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }
  
  if (!allowZero && numAmount === 0) {
    return { isValid: false, error: 'Amount cannot be zero' };
  }
  
  if (numAmount < min) {
    return { isValid: false, error: `Amount must be at least ${min}` };
  }
  
  if (numAmount > max) {
    return { isValid: false, error: `Amount cannot exceed ${max}` };
  }
  
  return { isValid: true, error: null };
};

// Required field validation
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true, error: null };
};

// Date range validation
export const validateDateRange = (startDate, endDate, options = {}) => {
  const {
    allowSameDay = true,
    maxRangeDays = 365,
    minRangeDays = 0,
    requireStart = true,
    requireEnd = true
  } = options;
  
  if (requireStart && !startDate) {
    return { isValid: false, error: 'Start date is required' };
  }
  
  if (requireEnd && !endDate) {
    return { isValid: false, error: 'End date is required' };
  }
  
  if (!startDate || !endDate) {
    return { isValid: true, error: null }; // Both not required, so valid
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    return { isValid: false, error: 'Invalid start date' };
  }
  
  if (isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid end date' };
  }
  
  if (end < start) {
    return { isValid: false, error: 'End date must be after start date' };
  }
  
  if (!allowSameDay && start.toDateString() === end.toDateString()) {
    return { isValid: false, error: 'Start and end dates cannot be the same' };
  }
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < minRangeDays) {
    return { isValid: false, error: `Date range must be at least ${minRangeDays} days` };
  }
  
  if (diffDays > maxRangeDays) {
    return { isValid: false, error: `Date range cannot exceed ${maxRangeDays} days` };
  }
  
  return { isValid: true, error: null };
};

// JSON validation
export const validateJSON = (jsonString) => {
  if (!jsonString) {
    return { isValid: false, error: 'JSON string is required' };
  }
  
  try {
    JSON.parse(jsonString);
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON format' };
  }
};

// URL validation
export const validateURL = (url, options = {}) => {
  const { requireProtocol = true, allowedProtocols = ['http:', 'https:'] } = options;
  
  if (!url) return { isValid: false, error: 'URL is required' };
  
  try {
    const urlObj = new URL(url);
    
    if (requireProtocol && !allowedProtocols.includes(urlObj.protocol)) {
      return { 
        isValid: false, 
        error: `URL must start with ${allowedProtocols.join(' or ')}` 
      };
    }
    
    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

// License plate validation
export const validateLicensePlate = (plate, country = 'US') => {
  if (!plate) return { isValid: false, error: 'License plate is required' };
  
  const cleanPlate = plate.toUpperCase().replace(/\s+/g, '');
  
  if (country === 'US') {
    // US plates: 1-7 letters/numbers, often with dash
    const usRegex = /^[A-Z0-9]{1,7}(?:-[A-Z0-9]{1,7})?$/;
    if (!usRegex.test(cleanPlate)) {
      return { 
        isValid: false, 
        error: 'Invalid US license plate format. Use format like ABC-1234' 
      };
    }
  } else if (country === 'UK') {
    // UK plates: AA11 AAA format
    const ukRegex = /^[A-Z]{2}\d{2}\s?[A-Z]{3}$/;
    if (!ukRegex.test(cleanPlate)) {
      return { 
        isValid: false, 
        error: 'Invalid UK license plate format. Use format like AB12 CDE' 
      };
    }
  }
  
  // Generic validation for other countries
  if (cleanPlate.length < 2 || cleanPlate.length > 12) {
    return { 
      isValid: false, 
      error: 'License plate must be between 2 and 12 characters' 
    };
  }
  
  return { isValid: true, error: null };
};

// Coordinate validation
export const validateCoordinates = (lat, lng) => {
  if (lat === null || lat === undefined || lat === '') {
    return { isValid: false, error: 'Latitude is required' };
  }
  
  if (lng === null || lng === undefined || lng === '') {
    return { isValid: false, error: 'Longitude is required' };
  }
  
  const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
  const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
  
  if (isNaN(numLat) || isNaN(numLng)) {
    return { isValid: false, error: 'Coordinates must be valid numbers' };
  }
  
  if (numLat < -90 || numLat > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90 degrees' };
  }
  
  if (numLng < -180 || numLng > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180 degrees' };
  }
  
  return { isValid: true, error: null };
};

// File validation
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    required = true
  } = options;
  
  if (!file) {
    return required 
      ? { isValid: false, error: 'File is required' }
      : { isValid: true, error: null };
  }
  
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { 
      isValid: false, 
      error: `File size cannot exceed ${maxSizeMB}MB` 
    };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
    };
  }
  
  return { isValid: true, error: null };
};

// Credit card validation (basic Luhn algorithm)
export const validateCreditCard = (cardNumber) => {
  if (!cardNumber) return { isValid: false, error: 'Card number is required' };
  
  // Remove all non-digit characters
  const cleanNumber = cardNumber.replace(/\D/g, '');
  
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return { isValid: false, error: 'Invalid card number length' };
  }
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  const isValid = sum % 10 === 0;
  
  return {
    isValid,
    error: isValid ? null : 'Invalid card number'
  };
};

// Expiry date validation
export const validateExpiryDate = (month, year) => {
  if (!month || !year) {
    return { isValid: false, error: 'Expiry month and year are required' };
  }
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  const expMonth = parseInt(month, 10);
  const expYear = parseInt(year, 10);
  
  if (isNaN(expMonth) || expMonth < 1 || expMonth > 12) {
    return { isValid: false, error: 'Invalid month' };
  }
  
  if (isNaN(expYear) || expYear < currentYear) {
    return { isValid: false, error: 'Card has expired' };
  }
  
  if (expYear === currentYear && expMonth < currentMonth) {
    return { isValid: false, error: 'Card has expired' };
  }
  
  return { isValid: true, error: null };
};

// CVV validation
export const validateCVV = (cvv, cardType = 'generic') => {
  if (!cvv) return { isValid: false, error: 'CVV is required' };
  
  const cleanCVV = cvv.replace(/\D/g, '');
  
  let expectedLength = 3;
  if (cardType === 'amex') {
    expectedLength = 4;
  }
  
  if (cleanCVV.length !== expectedLength) {
    return { 
      isValid: false, 
      error: `CVV must be ${expectedLength} digits` 
    };
  }
  
  return { isValid: true, error: null };
};

// Name validation
export const validateName = (name, fieldName = 'Name') => {
  if (!name) return { isValid: false, error: `${fieldName} is required` };
  
  if (name.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters` };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: `${fieldName} cannot exceed 50 characters` };
  }
  
  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[A-Za-z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return { 
      isValid: false, 
      error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` 
    };
  }
  
  return { isValid: true, error: null };
};

// Age validation
export const validateAge = (birthDate, minAge = 18, maxAge = 100) => {
  if (!birthDate) return { isValid: false, error: 'Birth date is required' };
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  if (isNaN(birth.getTime())) {
    return { isValid: false, error: 'Invalid birth date' };
  }
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  if (age < minAge) {
    return { isValid: false, error: `Must be at least ${minAge} years old` };
  }
  
  if (age > maxAge) {
    return { isValid: false, error: `Age cannot exceed ${maxAge} years` };
  }
  
  return { 
    isValid: true, 
    error: null,
    age 
  };
};

// Vehicle year validation
export const validateVehicleYear = (year) => {
  if (!year) return { isValid: false, error: 'Vehicle year is required' };
  
  const currentYear = new Date().getFullYear();
  const minYear = 1900;
  
  const numYear = parseInt(year, 10);
  
  if (isNaN(numYear)) {
    return { isValid: false, error: 'Year must be a valid number' };
  }
  
  if (numYear < minYear || numYear > currentYear + 1) {
    return { 
      isValid: false, 
      error: `Year must be between ${minYear} and ${currentYear + 1}` 
    };
  }
  
  return { isValid: true, error: null };
};

// Driver rating validation
export const validateRating = (rating, min = 1, max = 5) => {
  if (rating === null || rating === undefined) {
    return { isValid: false, error: 'Rating is required' };
  }
  
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;
  
  if (isNaN(numRating)) {
    return { isValid: false, error: 'Rating must be a valid number' };
  }
  
  if (numRating < min || numRating > max) {
    return { isValid: false, error: `Rating must be between ${min} and ${max}` };
  }
  
  return { isValid: true, error: null };
};

// Percentage validation
export const validatePercentage = (percentage, min = 0, max = 100) => {
  if (percentage === null || percentage === undefined) {
    return { isValid: false, error: 'Percentage is required' };
  }
  
  const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  
  if (isNaN(numPercentage)) {
    return { isValid: false, error: 'Percentage must be a valid number' };
  }
  
  if (numPercentage < min || numPercentage > max) {
    return { isValid: false, error: `Percentage must be between ${min} and ${max}` };
  }
  
  return { isValid: true, error: null };
};

// Distance validation
export const validateDistance = (distance, min = 0, max = 100000) => {
  if (distance === null || distance === undefined) {
    return { isValid: false, error: 'Distance is required' };
  }
  
  const numDistance = typeof distance === 'string' ? parseFloat(distance) : distance;
  
  if (isNaN(numDistance)) {
    return { isValid: false, error: 'Distance must be a valid number' };
  }
  
  if (numDistance < min) {
    return { isValid: false, error: `Distance cannot be less than ${min}` };
  }
  
  if (numDistance > max) {
    return { isValid: false, error: `Distance cannot exceed ${max}` };
  }
  
  return { isValid: true, error: null };
};

// Time validation (HH:MM format)
export const validateTime = (time) => {
  if (!time) return { isValid: false, error: 'Time is required' };
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (!timeRegex.test(time)) {
    return { isValid: false, error: 'Time must be in HH:MM format (24-hour)' };
  }
  
  return { isValid: true, error: null };
};

// Array validation
export const validateArray = (array, options = {}) => {
  const {
    minLength = 0,
    maxLength = 100,
    required = false
  } = options;
  
  if (!array && required) {
    return { isValid: false, error: 'Array is required' };
  }
  
  if (!Array.isArray(array)) {
    return { isValid: false, error: 'Must be an array' };
  }
  
  if (array.length < minLength) {
    return { isValid: false, error: `Must have at least ${minLength} items` };
  }
  
  if (array.length > maxLength) {
    return { isValid: false, error: `Cannot have more than ${maxLength} items` };
  }
  
  return { isValid: true, error: null };
};

// Object validation
export const validateObject = (obj, requiredKeys = [], options = {}) => {
  const { required = false } = options;
  
  if (!obj && required) {
    return { isValid: false, error: 'Object is required' };
  }
  
  if (obj && typeof obj !== 'object') {
    return { isValid: false, error: 'Must be an object' };
  }
  
  if (requiredKeys.length > 0 && obj) {
    const missingKeys = requiredKeys.filter(key => !(key in obj));
    if (missingKeys.length > 0) {
      return { 
        isValid: false, 
        error: `Missing required keys: ${missingKeys.join(', ')}` 
      };
    }
  }
  
  return { isValid: true, error: null };
};

// Username validation
export const validateUsername = (username) => {
  if (!username) return { isValid: false, error: 'Username is required' };
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username cannot exceed 20 characters' };
  }
  
  // Allow letters, numbers, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { 
      isValid: false, 
      error: 'Username can only contain letters, numbers, underscores, and hyphens' 
    };
  }
  
  return { isValid: true, error: null };
};

// Postal code validation
export const validatePostalCode = (postalCode, country = 'US') => {
  if (!postalCode) return { isValid: false, error: 'Postal code is required' };
  
  const cleanCode = postalCode.toUpperCase().replace(/\s+/g, '');
  
  if (country === 'US') {
    // US ZIP code: 5 digits or 5+4 format
    const usRegex = /^\d{5}(?:-\d{4})?$/;
    if (!usRegex.test(cleanCode)) {
      return { isValid: false, error: 'Invalid US ZIP code format' };
    }
  } else if (country === 'UK') {
    // UK postcode: various formats like AA1 1AA, A1 1AA, A1A 1AA, etc.
    const ukRegex = /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/;
    if (!ukRegex.test(cleanCode)) {
      return { isValid: false, error: 'Invalid UK postcode format' };
    }
  } else if (country === 'CA') {
    // Canadian postal code: A1A 1A1 format
    const caRegex = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
    if (!caRegex.test(cleanCode)) {
      return { isValid: false, error: 'Invalid Canadian postal code format' };
    }
  }
  
  return { isValid: true, error: null };
};

// Combine multiple validations
export const validateMultiple = (validations) => {
  const errors = [];
  let isValid = true;
  
  for (const validation of validations) {
    if (!validation.isValid) {
      isValid = false;
      errors.push(validation.error);
    }
  }
  
  return {
    isValid,
    errors: errors.length > 0 ? errors : null
  };
};

// Form field validation wrapper
export const validateField = (value, rules = []) => {
  const errors = [];
  
  for (const rule of rules) {
    const result = rule(value);
    if (!result.isValid) {
      errors.push(result.error);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Create validation rule
export const createRule = (validator, errorMessage) => {
  return (value) => ({
    isValid: validator(value),
    error: errorMessage
  });
};

// Predefined validation rules
export const rules = {
  required: (fieldName) => (value) => validateRequired(value, fieldName),
  email: () => (value) => ({ 
    isValid: validateEmail(value), 
    error: 'Invalid email address' 
  }),
  phone: () => (value) => ({ 
    isValid: validatePhone(value), 
    error: 'Invalid phone number' 
  }),
  minLength: (min) => (value) => ({
    isValid: value && value.length >= min,
    error: `Must be at least ${min} characters`
  }),
  maxLength: (max) => (value) => ({
    isValid: !value || value.length <= max,
    error: `Cannot exceed ${max} characters`
  }),
  min: (min) => (value) => ({
    isValid: !value || parseFloat(value) >= min,
    error: `Must be at least ${min}`
  }),
  max: (max) => (value) => ({
    isValid: !value || parseFloat(value) <= max,
    error: `Cannot exceed ${max}`
  }),
  numeric: () => (value) => ({
    isValid: !value || !isNaN(parseFloat(value)),
    error: 'Must be a number'
  }),
  url: () => (value) => validateURL(value)
};

export default {
  validateEmail,
  validatePhone,
  validatePassword,
  validateAmount,
  validateRequired,
  validateDateRange,
  validateJSON,
  validateURL,
  validateLicensePlate,
  validateCoordinates,
  validateFile,
  validateCreditCard,
  validateExpiryDate,
  validateCVV,
  validateName,
  validateAge,
  validateVehicleYear,
  validateRating,
  validatePercentage,
  validateDistance,
  validateTime,
  validateArray,
  validateObject,
  validateUsername,
  validatePostalCode,
  validateMultiple,
  validateField,
  createRule,
  rules
};