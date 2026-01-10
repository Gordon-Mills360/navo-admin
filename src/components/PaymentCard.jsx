import React, { useState } from 'react';
import {
  Box,
  Text,
  Badge,
  Flex,
  VStack,
  HStack,
  Divider,
  Button,
  useClipboard,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Tag,
  TagLabel,
  Tooltip,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { 
  CopyIcon, 
  ExternalLinkIcon, 
  CheckCircleIcon, 
  WarningIcon,
  TimeIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@chakra-ui/icons';
import { FaUser, FaUserTie, FaRoute, FaMotorcycle, FaCar } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { supabase } from '../services/supabase';

const PaymentCard = ({ payment, onVerify, onApplyCommission }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [passengerInfo, setPassengerInfo] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [rideInfo, setRideInfo] = useState(null);
  
  const toast = useToast();
  const reference = payment?.paystack_reference || payment?.reference_id || '';
  const { onCopy } = useClipboard(reference);

  // Commission settings
  const COMMISSION_RATE = 20; // 20% platform commission

  // Fetch related data on component mount
  React.useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        // Fetch passenger info if passenger_id exists
        if (payment?.passenger_id) {
          const { data: passenger } = await supabase
            .from('profiles')
            .select('full_name, email, phone, role')
            .eq('id', payment.passenger_id)
            .single();
          setPassengerInfo(passenger);
        }

        // Fetch driver info if driver_id exists
        if (payment?.driver_id) {
          const { data: driver } = await supabase
            .from('profiles')
            .select('full_name, email, phone, role, vehicle_number')
            .eq('id', payment.driver_id)
            .single();
          setDriverInfo(driver);
        }

        // Fetch ride info if ride_id exists
        if (payment?.ride_id) {
          const { data: ride } = await supabase
            .from('rides')
            .select('pickup_location, dropoff_location, city, distance_km, duration_min, fare, status')
            .eq('id', payment.ride_id)
            .single();
          setRideInfo(ride);
        }
      } catch (error) {
        console.warn('Error fetching related data:', error);
        // Silently fail - we'll handle missing data gracefully
      }
    };

    fetchRelatedData();
  }, [payment]);

  // Safely get status with fallback
  const getStatusColor = (status) => {
    if (!status) return 'gray';
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'success':
      case 'completed':
      case 'paid': return 'green';
      case 'pending':
      case 'processing': return 'yellow';
      case 'failed':
      case 'declined':
      case 'cancelled': return 'red';
      case 'refunded': return 'purple';
      case 'disputed': return 'orange';
      default: return 'gray';
    }
  };

  // Safe currency formatting for Ghanaian Cedis
  const formatCurrency = (amount, currency = 'GHS') => {
    if (amount == null || amount === '') {
      return currency === 'GHS' ? '₵0.00' : '$0.00';
    }
    
    const numericAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) 
      : Number(amount);
    
    if (isNaN(numericAmount)) {
      return currency === 'GHS' ? '₵0.00' : '$0.00';
    }
    
    // Format based on currency
    if (currency === 'GHS') {
      return `₵${numericAmount.toLocaleString('en-GH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else if (currency === 'USD') {
      return `$${numericAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else {
      return `${numericAmount.toFixed(2)} ${currency}`;
    }
  };

  // Safe date formatting with validation
  const formatDate = (dateString, format = 'medium') => {
    if (!dateString) return 'Date unavailable';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      if (format === 'short') {
        return date.toLocaleDateString('en-GH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Africa/Accra',
        });
      } else if (format === 'date-only') {
        return date.toLocaleDateString('en-GH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'Africa/Accra',
        });
      } else {
        return date.toLocaleDateString('en-GH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Africa/Accra',
        });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date error';
    }
  };

  // Calculate commission split
  const calculateCommissionSplit = () => {
    const amount = parseFloat(payment?.amount) || 0;
    const existingCommission = parseFloat(payment?.commission) || 0;
    const existingPayout = parseFloat(payment?.driver_payout || payment?.driver_earnings) || 0;
    
    // If commission already exists in database, use it
    if (existingCommission > 0 && existingPayout > 0) {
      const platformPercentage = (existingCommission / amount) * 100;
      const driverPercentage = (existingPayout / amount) * 100;
      
      return {
        totalAmount: amount,
        platformCommission: existingCommission,
        driverPayout: existingPayout,
        platformPercentage: Math.round(platformPercentage * 100) / 100,
        driverPercentage: Math.round(driverPercentage * 100) / 100,
        commissionRate: Math.round(platformPercentage),
        alreadyApplied: true,
      };
    }
    
    // Calculate new commission split
    const commissionRate = COMMISSION_RATE;
    const commission = (amount * commissionRate) / 100;
    const driverPayout = amount - commission;
    
    const platformPercentage = (commission / amount) * 100;
    const driverPercentage = (driverPayout / amount) * 100;
    
    return {
      totalAmount: amount,
      platformCommission: parseFloat(commission.toFixed(2)),
      driverPayout: parseFloat(driverPayout.toFixed(2)),
      platformPercentage: Math.round(platformPercentage * 100) / 100,
      driverPercentage: Math.round(driverPercentage * 100) / 100,
      commissionRate,
      alreadyApplied: false,
    };
  };

  const handleCopyReference = () => {
    if (!reference) {
      toast({
        title: 'No reference available',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    onCopy();
    toast({
      title: 'Copied!',
      description: 'Payment reference copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Handle verification
  const handleVerification = async () => {
    if (!reference) {
      toast({
        title: 'No reference available',
        description: 'This payment does not have a reference for verification',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsVerifying(true);
    setShowVerificationModal(false);
    
    try {
      if (onVerify) {
        await onVerify(payment);
      } else {
        // Show info since we don't have a real verification endpoint
        toast({
          title: 'Verification Info',
          description: 'Payment verification would be integrated with PayStack API',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify payment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle commission application
  const handleApplyCommission = async () => {
    const commissionSplit = calculateCommissionSplit();
    
    if (commissionSplit.alreadyApplied) {
      toast({
        title: 'Commission Already Applied',
        description: `Commission of ${formatCurrency(commissionSplit.platformCommission)} already applied`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (onApplyCommission) {
        await onApplyCommission(payment.id, payment.amount);
      } else {
        // Direct commission application to Supabase
        const { error } = await supabase
          .from('payments')
          .update({
            commission: commissionSplit.platformCommission,
            driver_payout: commissionSplit.driverPayout,
            driver_earnings: commissionSplit.driverPayout,
            commission_rate: commissionSplit.platformPercentage,
            commission_applied_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        if (error) throw error;

        toast({
          title: 'Commission Applied',
          description: `Commission of ${formatCurrency(commissionSplit.platformCommission)} applied to payment`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Commission application error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply commission. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refund
  const handleRefund = () => {
    toast({
      title: 'Refund Initiated',
      description: 'Refund feature will be implemented soon',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // Safely extract payment ID
  const getPaymentId = () => {
    if (!payment?.id) return 'Payment ID unavailable';
    
    const id = String(payment.id);
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  };

  // Get payment type
  const getPaymentType = () => {
    const type = payment?.payment_type || 'ride_payment';
    switch (type) {
      case 'ride_payment': return 'Ride Payment';
      case 'driver_payout': return 'Driver Payout';
      case 'wallet_topup': return 'Wallet Top-up';
      case 'refund': return 'Refund';
      default: return 'Payment';
    }
  };

  // Get payment method display
  const getPaymentMethod = () => {
    const method = payment?.payment_method || '';
    switch (method) {
      case 'mobile_money': return 'Mobile Money';
      case 'card': return 'Card';
      case 'cash': return 'Cash';
      case 'wallet': return 'Wallet';
      default: return method || 'N/A';
    }
  };

  // Calculate if commission needs to be applied
  const commissionSplit = calculateCommissionSplit();
  const needsCommission = !commissionSplit.alreadyApplied && 
    payment?.status?.toLowerCase() === 'success' && 
    payment?.payment_type === 'ride_payment';

  // Early return if no payment data
  if (!payment) {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor="gray.200"
        p={4}
      >
        <Alert status="warning">
          <AlertIcon />
          <Text>No payment data available</Text>
        </Alert>
      </Box>
    );
  }

  const statusColor = getStatusColor(payment.status);
  const statusText = payment.status ? payment.status.toUpperCase() : 'UNKNOWN';
  const currency = payment?.currency || 'GHS';
  const isSuccess = payment?.status?.toLowerCase() === 'success' || 
                    payment?.status?.toLowerCase() === 'paid';
  const isPending = payment?.status?.toLowerCase() === 'pending' || 
                    payment?.status?.toLowerCase() === 'processing';

  return (
    <>
      <Box
        bg="white"
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor="gray.200"
        p={4}
        _hover={{ shadow: 'md' }}
        transition="shadow 0.2s"
      >
        {/* Header */}
        <Flex justify="space-between" align="start" mb={4}>
          <VStack align="start" spacing={1}>
            <Flex align="center" gap={2}>
              <Text fontSize="lg" fontWeight="bold">
                {getPaymentType()} {getPaymentId()}
              </Text>
              <Tag size="sm" colorScheme="blue" borderRadius="full">
                <TagLabel>{getPaymentMethod()}</TagLabel>
              </Tag>
            </Flex>
            <Text fontSize="sm" color="gray.600">
              {formatDate(payment.created_at, 'short')}
            </Text>
          </VStack>
          
          <VStack align="end" spacing={2}>
            <Badge
              colorScheme={statusColor}
              fontSize="sm"
              px={3}
              py={1}
              borderRadius="full"
              textTransform="uppercase"
            >
              {statusText}
            </Badge>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {formatCurrency(payment.amount, currency)}
            </Text>
          </VStack>
        </Flex>
        
        <Divider my={4} />
        
        {/* Commission Breakdown */}
        <Box mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="md" fontWeight="600">Commission Breakdown</Text>
            {needsCommission && (
              <Button
                size="sm"
                colorScheme="yellow"
                leftIcon={<InfoIcon />}
                onClick={handleApplyCommission}
                isLoading={isLoading}
                loadingText="Applying..."
              >
                Apply Commission
              </Button>
            )}
          </Flex>
          
          <Box bg="gray.50" borderRadius="md" p={4}>
            <Flex justify="space-between" align="center" mb={4}>
              <Stat>
                <StatLabel>Platform Commission</StatLabel>
                <StatNumber color="green.600">
                  {formatCurrency(commissionSplit.platformCommission, currency)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {commissionSplit.platformPercentage}%
                </StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Driver Payout</StatLabel>
                <StatNumber color="blue.600">
                  {formatCurrency(commissionSplit.driverPayout, currency)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  {commissionSplit.driverPercentage}%
                </StatHelpText>
              </Stat>
            </Flex>
            
            <Progress 
              value={commissionSplit.platformPercentage} 
              colorScheme="green" 
              size="sm" 
              borderRadius="full"
            />
            
            <Flex justify="space-between" mt={2}>
              <Text fontSize="xs" color="green.600">
                Platform: {commissionSplit.platformPercentage}%
              </Text>
              <Text fontSize="xs" color="blue.600">
                Driver: {commissionSplit.driverPercentage}%
              </Text>
            </Flex>
          </Box>
        </Box>
        
        {/* Transaction Details */}
        <Box mb={6}>
          <Text fontSize="md" fontWeight="600" mb={3}>Transaction Details</Text>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Reference ID</Text>
              <Flex align="center" gap={2}>
                <Text
                  fontSize="sm"
                  fontFamily="mono"
                  bg="gray.50"
                  px={3}
                  py={1}
                  borderRadius="md"
                  flex="1"
                  isTruncated
                >
                  {reference || 'Not provided'}
                </Text>
                {reference && (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<CopyIcon />}
                    onClick={handleCopyReference}
                    aria-label="Copy reference"
                  >
                    Copy
                  </Button>
                )}
              </Flex>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Payment Provider</Text>
              <Flex align="center" gap={2}>
                <Badge colorScheme="green" px={2} py={1}>
                  {payment.payment_provider || 'PayStack'}
                </Badge>
                {payment.channel && (
                  <Text fontSize="sm" color="gray.600">
                    via {payment.channel}
                  </Text>
                )}
              </Flex>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Transaction Date</Text>
              <Text fontSize="sm">
                {formatDate(payment.created_at)}
              </Text>
            </Box>
            
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Processed</Text>
              <Text fontSize="sm">
                {payment.processed_at ? formatDate(payment.processed_at) : 'Not processed'}
              </Text>
            </Box>
          </Grid>
        </Box>
        
        {/* Associated Ride */}
        {rideInfo && (
          <Box mb={6}>
            <Text fontSize="md" fontWeight="600" mb={3}>Associated Ride</Text>
            <Box bg="blue.50" borderRadius="md" p={4}>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="600">
                  {rideInfo.status ? `Ride - ${rideInfo.status}` : 'Ride Details'}
                </Text>
                <Badge colorScheme="blue">
                  {formatCurrency(rideInfo.fare, currency)}
                </Badge>
              </Flex>
              
              <VStack align="start" spacing={1}>
                <HStack>
                  <FaRoute color="#6B7280" size="14px" />
                  <Text fontSize="sm">
                    From: {rideInfo.pickup_location || 'Pickup location'}
                  </Text>
                </HStack>
                
                <HStack>
                  <FaRoute color="#6B7280" size="14px" />
                  <Text fontSize="sm">
                    To: {rideInfo.dropoff_location || 'Destination'}
                  </Text>
                </HStack>
                
                <Flex gap={4} mt={2}>
                  <HStack>
                    <TimeIcon color="gray.500" fontSize="sm" />
                    <Text fontSize="xs" color="gray.600">
                      {rideInfo.distance_km || 0} km • {rideInfo.duration_min || 0} min
                    </Text>
                  </HStack>
                  {rideInfo.city && (
                    <Text fontSize="xs" color="gray.600">
                      {rideInfo.city}
                    </Text>
                  )}
                </Flex>
              </VStack>
            </Box>
          </Box>
        )}
        
        {/* User Information */}
        <Box mb={6}>
          <Text fontSize="md" fontWeight="600" mb={3}>User Information</Text>
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            {/* Passenger */}
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Passenger</Text>
              <Box bg="green.50" borderRadius="md" p={3}>
                <Flex align="center" gap={2} mb={2}>
                  <FaUser color="#059669" />
                  <Text fontWeight="600">
                    {passengerInfo?.full_name || 'Passenger unavailable'}
                  </Text>
                </Flex>
                <Text fontSize="sm" color="gray.600">
                  {passengerInfo?.email || 'N/A'}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {passengerInfo?.phone || 'N/A'}
                </Text>
              </Box>
            </Box>
            
            {/* Driver */}
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Driver</Text>
              <Box bg="blue.50" borderRadius="md" p={3}>
                <Flex align="center" gap={2} mb={2}>
                  <FaUserTie color="#3B82F6" />
                  <Text fontWeight="600">
                    {driverInfo?.full_name || 'Driver unavailable'}
                  </Text>
                </Flex>
                <Text fontSize="sm" color="gray.600">
                  {driverInfo?.email || 'N/A'}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {driverInfo?.phone || 'N/A'}
                </Text>
                {driverInfo?.vehicle_number && (
                  <Flex align="center" gap={2} mt={2}>
                    <FaMotorcycle color="#4B5563" />
                    <Badge colorScheme="blue" fontSize="xs">
                      {driverInfo.vehicle_number}
                    </Badge>
                  </Flex>
                )}
              </Box>
            </Box>
          </Grid>
        </Box>
        
        {/* Actions */}
        <Divider my={4} />
        
        <Flex justify="space-between" align="center">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={showDetails ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
          
          <HStack spacing={3}>
            {isPending && reference && (
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={<CheckCircleIcon />}
                onClick={() => setShowVerificationModal(true)}
                isLoading={isVerifying}
                loadingText="Verifying"
              >
                Verify
              </Button>
            )}
            
            {isSuccess && (
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                leftIcon={<WarningIcon />}
                onClick={handleRefund}
              >
                Refund
              </Button>
            )}
            
            {reference && (
              <Button
                size="sm"
                colorScheme="blue"
                variant="ghost"
                leftIcon={<ExternalLinkIcon />}
                onClick={() => window.open(`https://dashboard.paystack.com/#/transactions/${reference}`, '_blank')}
              >
                PayStack
              </Button>
            )}
          </HStack>
        </Flex>
        
        {/* Additional Details */}
        {showDetails && (
          <Box mt={6} pt={4} borderTopWidth="1px" borderTopColor="gray.200">
            <Text fontSize="md" fontWeight="600" mb={3}>Additional Details</Text>
            
            <Grid templateColumns="repeat(2, 1fr)" gap={4} mb={4}>
              {payment.transaction_id && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>Transaction ID</Text>
                  <Text fontSize="sm" fontFamily="mono">
                    {payment.transaction_id}
                  </Text>
                </Box>
              )}
              
              {payment.authorization_code && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>Auth Code</Text>
                  <Text fontSize="sm" fontFamily="mono">
                    {payment.authorization_code}
                  </Text>
                </Box>
              )}
              
              {payment.ip_address && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>IP Address</Text>
                  <Text fontSize="sm" fontFamily="mono">
                    {payment.ip_address}
                  </Text>
                </Box>
              )}
              
              {payment.metadata && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>Metadata</Text>
                  <Text fontSize="sm" fontFamily="mono" whiteSpace="pre-wrap">
                    {JSON.stringify(payment.metadata, null, 2)}
                  </Text>
                </Box>
              )}
            </Grid>
            
            {payment.notes && (
              <Box>
                <Text fontSize="sm" color="gray.600" mb={1}>Notes</Text>
                <Text fontSize="sm" color="gray.700" fontStyle="italic">
                  {payment.notes}
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Verification Modal */}
      <Modal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Verify Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Verify PayStack payment for reference: 
                <Text as="span" fontFamily="mono" fontWeight="bold" ml={2}>
                  {reference}
                </Text>
              </Text>
              
              <Box bg="yellow.50" p={4} borderRadius="md">
                <Text fontSize="sm" color="yellow.800">
                  <WarningIcon mr={2} />
                  This will verify the payment status with PayStack and update the local record.
                </Text>
              </Box>
              
              <Box>
                <Text fontWeight="medium">Payment Details:</Text>
                <Text>Amount: {formatCurrency(payment.amount, payment.currency)}</Text>
                <Text>Passenger: {passengerInfo?.full_name || 'N/A'}</Text>
                <Text>Status: {statusText}</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowVerificationModal(false)}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={handleVerification}
              isLoading={isVerifying}
            >
              Verify Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

// Prop validation
PaymentCard.propTypes = {
  payment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    commission: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    driver_payout: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    driver_earnings: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    commission_rate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    commission_applied_at: PropTypes.string,
    paystack_reference: PropTypes.string,
    reference_id: PropTypes.string,
    created_at: PropTypes.string,
    processed_at: PropTypes.string,
    currency: PropTypes.string,
    payment_type: PropTypes.string,
    payment_method: PropTypes.string,
    payment_provider: PropTypes.string,
    channel: PropTypes.string,
    ip_address: PropTypes.string,
    transaction_id: PropTypes.string,
    authorization_code: PropTypes.string,
    notes: PropTypes.string,
    metadata: PropTypes.object,
    passenger_id: PropTypes.string,
    driver_id: PropTypes.string,
    ride_id: PropTypes.string,
  }),
  onVerify: PropTypes.func,
  onApplyCommission: PropTypes.func,
};

PaymentCard.defaultProps = {
  payment: null,
  onVerify: null,
  onApplyCommission: null,
};

export default PaymentCard;