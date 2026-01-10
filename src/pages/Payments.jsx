import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  Button,
  Flex,
  Text,
  Badge,
  InputGroup,
  InputLeftElement,
  useToast,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Switch,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Divider,
  Tag,
  TagLabel,
  Progress,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Radio,
  RadioGroup,
  Stack,
  Container,
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  ChevronDownIcon,
  RepeatIcon,
  ViewIcon,
  CloseIcon,
  CalendarIcon,
  WarningIcon,
  CheckCircleIcon,
  ArrowForwardIcon,
  ArrowBackIcon,
  EditIcon,
  LockIcon,
  DownloadIcon,
} from '@chakra-ui/icons';
import { FiFilter, FiUser, FiUserCheck, FiDollarSign } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import PaymentCard from '../components/PaymentCard';

// Constants
const ITEMS_PER_PAGE = 10;
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

// Commission settings
const COMMISSION_SETTINGS = {
  DEFAULT_COMMISSION_RATE: 20, // 20% platform commission
  MIN_COMMISSION: 1, // Minimum commission amount
  MAX_COMMISSION: 100, // Maximum commission amount
  DRIVER_SHARE: 80, // 80% goes to driver
};

// Payment types
const PAYMENT_TYPES = {
  RIDE_PAYMENT: 'ride_payment',
  DRIVER_PAYOUT: 'driver_payout',
  WALLET_TOPUP: 'wallet_topup',
  REFUND: 'refund',
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentType: 'all',
    startDate: '',
    endDate: '',
    currency: 'all',
    minAmount: '',
    maxAmount: '',
    commissionRate: COMMISSION_SETTINGS.DEFAULT_COMMISSION_RATE,
  });
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCommission: 0,
    totalDriverEarnings: 0,
    totalPassengerPayments: 0,
    totalDriverPayouts: 0,
    totalPayments: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundedCount: 0,
    disputedCount: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentTypeTab, setPaymentTypeTab] = useState('all'); // 'all', 'passenger', 'driver'
  const [verifyingPayment, setVerifyingPayment] = useState(null);
  const [loadingCommission, setLoadingCommission] = useState(false);
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isFilterOpen, 
    onOpen: onFilterOpen, 
    onClose: onFilterClose 
  } = useDisclosure();
  
  const { 
    isOpen: isVerificationModalOpen, 
    onOpen: onVerificationModalOpen, 
    onClose: onVerificationModalClose 
  } = useDisclosure();

  // Safe currency formatting for Ghana and future expansion
  const formatCurrency = useCallback((amount, currency = 'GHS') => {
    if (amount == null || amount === '') {
      return currency === 'GHS' ? '₵0.00' : `$${0.00.toFixed(2)}`;
    }
    
    const numericAmount = typeof amount === 'string' 
      ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) 
      : Number(amount);
    
    if (isNaN(numericAmount)) {
      return currency === 'GHS' ? '₵0.00' : `$${0.00.toFixed(2)}`;
    }
    
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
    } else if (currency === 'EUR') {
      return `€${numericAmount.toLocaleString('en-EU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    
    // Fallback for other currencies
    return `${numericAmount.toFixed(2)} ${currency}`;
  }, []);

  // Safe date formatting for Ghana
  const formatDate = useCallback((dateString, format = 'medium') => {
    if (!dateString) return 'Date unavailable';
    
    try {
      const date = new Date(dateString);
      
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
  }, []);

  // Safe status color mapping
  const getStatusColor = useCallback((status) => {
    if (!status) return 'gray';
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'success':
      case 'completed':
      case 'approved':
      case 'paid':
        return 'green';
      case 'pending':
      case 'processing':
        return 'yellow';
      case 'failed':
      case 'declined':
      case 'cancelled':
        return 'red';
      case 'refunded':
      case 'partially_refunded':
        return 'purple';
      case 'disputed':
      case 'charged_back':
        return 'orange';
      default:
        return 'gray';
    }
  }, []);

  // Format status for display
  const formatStatus = useCallback((status) => {
    if (!status) return 'Unknown';
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'success': return 'Success';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      case 'refunded': return 'Refunded';
      case 'disputed': return 'Disputed';
      case 'paid': return 'Paid';
      case 'processing': return 'Processing';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }, []);

  // Calculate commission split
  const calculateCommissionSplit = useCallback((amount, commissionRate = filters.commissionRate) => {
    const numericAmount = parseFloat(amount) || 0;
    const rate = parseFloat(commissionRate) || COMMISSION_SETTINGS.DEFAULT_COMMISSION_RATE;
    
    // Calculate commission
    let commission = (numericAmount * rate) / 100;
    
    // Apply min/max limits
    commission = Math.max(commission, COMMISSION_SETTINGS.MIN_COMMISSION);
    commission = Math.min(commission, COMMISSION_SETTINGS.MAX_COMMISSION);
    
    // Calculate driver payout
    const driverPayout = numericAmount - commission;
    
    // Calculate percentages
    const actualPlatformPercentage = (commission / numericAmount) * 100;
    const actualDriverPercentage = (driverPayout / numericAmount) * 100;

    return {
      totalAmount: parseFloat(numericAmount.toFixed(2)),
      platformCommission: parseFloat(commission.toFixed(2)),
      driverPayout: parseFloat(driverPayout.toFixed(2)),
      platformPercentage: parseFloat(actualPlatformPercentage.toFixed(2)),
      driverPercentage: parseFloat(actualDriverPercentage.toFixed(2)),
      commissionRate: rate,
    };
  }, [filters.commissionRate]);

  // Verify PayStack payment
  const verifyPayStackPayment = useCallback(async (paymentReference) => {
    if (!paymentReference) {
      toast({
        title: 'Error',
        description: 'No payment reference provided',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setVerifyingPayment(paymentReference);
      
      toast({
        title: 'Verification Info',
        description: 'Payment verification would be integrated with PayStack API',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: 'Payment Verified',
        description: `Payment ${paymentReference} has been verified successfully`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh payments data
      await fetchPayments();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify payment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setVerifyingPayment(null);
      onVerificationModalClose();
    }
  }, [toast, onVerificationModalClose]);

  // Process commission split for a payment
  const processCommissionSplit = useCallback(async (paymentId, amount, commissionRate = null) => {
    try {
      const rate = commissionRate || filters.commissionRate;
      const split = calculateCommissionSplit(amount, rate);
      
      // Update payment with commission split
      const { error } = await supabase
        .from('payments')
        .update({
          commission: split.platformCommission,
          driver_payout: split.driverPayout,
          driver_earnings: split.driverPayout,
          commission_rate: split.platformPercentage,
          commission_applied_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'Commission Applied',
        description: `Commission of ${formatCurrency(split.platformCommission)} applied to payment`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh payments data
      await fetchPayments();
    } catch (error) {
      console.error('Error applying commission:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply commission. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [calculateCommissionSplit, filters.commissionRate, formatCurrency, toast]);

  // Fetch payments with simplified query
  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simple query without joins that cause errors
      const { data, error: fetchError, count } = await supabase
        .from('payments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }
      
      setPayments(data || []);
      
      // Calculate comprehensive stats
      const stats = {
        totalAmount: 0,
        totalCommission: 0,
        totalDriverEarnings: 0,
        totalPassengerPayments: 0,
        totalDriverPayouts: 0,
        totalPayments: count || 0,
        successCount: 0,
        pendingCount: 0,
        failedCount: 0,
        refundedCount: 0,
        disputedCount: 0,
        platformEarnings: 0,
      };
      
      data?.forEach(payment => {
        const amount = parseFloat(payment.amount) || 0;
        const commission = parseFloat(payment.commission) || 0;
        const driverEarnings = parseFloat(payment.driver_earnings || payment.driver_payout) || 0;
        const paymentType = payment.payment_type || PAYMENT_TYPES.RIDE_PAYMENT;
        
        // Update totals based on payment type
        if (paymentType === PAYMENT_TYPES.RIDE_PAYMENT) {
          stats.totalPassengerPayments += amount;
        } else if (paymentType === PAYMENT_TYPES.DRIVER_PAYOUT) {
          stats.totalDriverPayouts += amount;
        }
        
        stats.totalAmount += amount;
        stats.totalCommission += commission;
        stats.totalDriverEarnings += driverEarnings;
        stats.platformEarnings += commission;
        
        // Count by status
        const status = payment.status?.toLowerCase();
        switch (status) {
          case 'success':
          case 'completed':
          case 'paid':
            stats.successCount++;
            break;
          case 'pending':
          case 'processing':
            stats.pendingCount++;
            break;
          case 'failed':
          case 'declined':
          case 'cancelled':
            stats.failedCount++;
            break;
          case 'refunded':
          case 'partially_refunded':
            stats.refundedCount++;
            break;
          case 'disputed':
          case 'charged_back':
            stats.disputedCount++;
            break;
        }
      });
      
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.message || 'Failed to fetch payments');
      
      toast({
        title: 'Failed to load payments',
        description: error.message || 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle filter changes with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger filter recalculation
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    fetchPayments();
    
    // Set up real-time subscription for payment changes
    const channel = supabase
      .channel('payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayments]);

  // Filter payments based on current filters
  const filteredPayments = useMemo(() => {
    let result = [...payments];
    
    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      result = result.filter(payment => {
        return (
          payment.paystack_reference?.toLowerCase().includes(searchTerm) ||
          payment.reference_id?.toLowerCase().includes(searchTerm) ||
          payment.transaction_id?.toLowerCase().includes(searchTerm) ||
          payment.id?.toString().includes(searchTerm)
        );
      });
    }
    
    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(payment => 
        payment.status?.toLowerCase() === filters.status.toLowerCase()
      );
    }
    
    // Payment type filter
    if (paymentTypeTab !== 'all') {
      if (paymentTypeTab === 'passenger') {
        result = result.filter(payment => 
          payment.payment_type === PAYMENT_TYPES.RIDE_PAYMENT
        );
      } else if (paymentTypeTab === 'driver') {
        result = result.filter(payment => 
          payment.payment_type === PAYMENT_TYPES.DRIVER_PAYOUT
        );
      }
    }
    
    // Currency filter
    if (filters.currency !== 'all') {
      result = result.filter(payment => 
        payment.currency === filters.currency
      );
    }
    
    // Date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(payment => {
        const paymentDate = new Date(payment.created_at);
        return paymentDate <= endDate;
      });
    }
    
    // Amount filters
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      if (!isNaN(minAmount)) {
        result = result.filter(payment => {
          const amount = parseFloat(payment.amount) || 0;
          return amount >= minAmount;
        });
      }
    }
    
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      if (!isNaN(maxAmount)) {
        result = result.filter(payment => {
          const amount = parseFloat(payment.amount) || 0;
          return amount <= maxAmount;
        });
      }
    }
    
    return result;
  }, [payments, filters, paymentTypeTab]);

  // Handle filter changes
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value 
    }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      paymentType: 'all',
      startDate: '',
      endDate: '',
      currency: 'all',
      minAmount: '',
      maxAmount: '',
      commissionRate: COMMISSION_SETTINGS.DEFAULT_COMMISSION_RATE,
    });
    setPaymentTypeTab('all');
    setCurrentPage(1);
  }, []);

  // Export to CSV with proper escaping
  const exportToCSV = useCallback(() => {
    try {
      if (filteredPayments.length === 0) {
        toast({
          title: 'No data to export',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const headers = [
        'ID',
        'Date',
        'Time',
        'PayStack Reference',
        'Payment Type',
        'Amount (GHS)',
        'Commission (GHS)',
        'Commission Rate (%)',
        'Driver Payout (GHS)',
        'Platform Earnings (GHS)',
        'Status',
        'Currency',
        'Payment Method',
      ];
      
      const csvData = filteredPayments.map(payment => {
        const date = new Date(payment.created_at);
        const commissionSplit = calculateCommissionSplit(payment.amount);
        
        return [
          payment.id,
          date.toISOString().split('T')[0], // Date
          date.toTimeString().split(' ')[0], // Time
          `"${payment.paystack_reference || ''}"`,
          payment.payment_type || PAYMENT_TYPES.RIDE_PAYMENT,
          payment.amount || 0,
          payment.commission || commissionSplit.platformCommission,
          payment.commission_rate || commissionSplit.platformPercentage,
          payment.driver_payout || commissionSplit.driverPayout,
          commissionSplit.platformCommission,
          payment.status || '',
          payment.currency || 'GHS',
          payment.payment_method || '',
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download', 
        `payments_export_${new Date().toISOString().split('T')[0]}_${filteredPayments.length}_records.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: `${filteredPayments.length} records exported`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [filteredPayments, toast, calculateCommissionSplit]);

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPayments();
    setIsRefreshing(false);
    
    toast({
      title: 'Data refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [fetchPayments, toast]);

  // View payment details
  const viewPaymentDetails = useCallback((payment) => {
    setSelectedPayment(payment);
    onOpen();
  }, [onOpen]);

  // Handle verification
  const handleVerification = useCallback((payment) => {
    if (payment.paystack_reference) {
      setSelectedPayment(payment);
      onVerificationModalOpen();
    } else {
      toast({
        title: 'No Reference',
        description: 'This payment does not have a PayStack reference',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [onVerificationModalOpen, toast]);

  // Apply commission to all payments
  const applyCommissionToAll = useCallback(async () => {
    try {
      const pendingPayments = filteredPayments.filter(p => 
        (!p.commission || p.commission === 0) && 
        p.status === 'success' && 
        p.payment_type === PAYMENT_TYPES.RIDE_PAYMENT
      );
      
      if (pendingPayments.length === 0) {
        toast({
          title: 'No Payments Need Commission',
          description: 'All successful ride payments already have commission applied',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      setLoadingCommission(true);
      
      toast({
        title: 'Applying Commission',
        description: `Applying commission to ${pendingPayments.length} payments...`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const payment of pendingPayments) {
        try {
          await processCommissionSplit(payment.id, payment.amount);
          successCount++;
        } catch (error) {
          console.error(`Error applying commission to payment ${payment.id}:`, error);
          errorCount++;
        }
      }
      
      toast({
        title: 'Commission Applied',
        description: `Successfully applied commission to ${successCount} payments. ${errorCount} failed.`,
        status: successCount > 0 ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error applying commission to all:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply commission to all payments',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingCommission(false);
    }
  }, [filteredPayments, processCommissionSplit, toast]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Calculate commission statistics
  const commissionStats = useMemo(() => {
    const successfulRidePayments = filteredPayments.filter(p => 
      p.status === 'success' && p.payment_type === PAYMENT_TYPES.RIDE_PAYMENT
    );
    
    let totalCommission = 0;
    let totalRideAmount = 0;
    
    successfulRidePayments.forEach(payment => {
      totalRideAmount += parseFloat(payment.amount) || 0;
      totalCommission += parseFloat(payment.commission) || 0;
    });
    
    const avgCommissionRate = totalRideAmount > 0 ? (totalCommission / totalRideAmount) * 100 : 0;
    
    return {
      totalCommission,
      totalRideAmount,
      avgCommissionRate: parseFloat(avgCommissionRate.toFixed(2)),
      commissionAppliedCount: successfulRidePayments.filter(p => p.commission > 0).length,
      pendingCommissionCount: successfulRidePayments.filter(p => !p.commission || p.commission === 0).length,
    };
  }, [filteredPayments]);

  // Render loading state
  if (isLoading) {
    return (
      <Container maxW="container.xl" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Skeleton height="40px" width="200px" />
          <Skeleton height="40px" width="150px" />
        </Flex>
        
        <Flex mb={6} gap={4}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} flex="1" height="100px" borderRadius="lg" />
          ))}
        </Flex>
        
        <Skeleton height="400px" borderRadius="lg" mb={6} />
        <Skeleton height="200px" borderRadius="lg" />
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>Payments & Commission</Heading>
          <Text color="gray.600">
            {stats.totalPayments} total payments • {stats.successCount} successful • 
            Platform Earnings: {formatCurrency(stats.platformEarnings, 'GHS')}
          </Text>
        </Box>
        
        <Flex gap={3}>
          <Button
            leftIcon={<LockIcon />}
            colorScheme="green"
            onClick={applyCommissionToAll}
            isLoading={loadingCommission}
            loadingText="Applying..."
            isDisabled={commissionStats.pendingCommissionCount === 0}
          >
            Apply Commission ({commissionStats.pendingCommissionCount})
          </Button>
          
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              {viewMode === 'table' ? 'Table View' : 'Card View'}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setViewMode('table')}>Table View</MenuItem>
              <MenuItem onClick={() => setViewMode('card')}>Card View</MenuItem>
            </MenuList>
          </Menu>
          
          <Tooltip label="Refresh data">
            <IconButton
              icon={<RepeatIcon />}
              aria-label="Refresh"
              onClick={refreshData}
              isLoading={isRefreshing}
            />
          </Tooltip>
          
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="blue"
            onClick={exportToCSV}
            isDisabled={filteredPayments.length === 0}
          >
            Export CSV
          </Button>
        </Flex>
      </Flex>
      
      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6} borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error loading payments</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
          <Button size="sm" onClick={fetchPayments}>
            Retry
          </Button>
        </Alert>
      )}
      
      {/* Commission Settings */}
      <Box bg="white" p={4} borderRadius="lg" shadow="sm" mb={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Commission Settings</Heading>
          <Tag colorScheme="blue" size="lg">
            <TagLabel>Current Rate: {filters.commissionRate}%</TagLabel>
          </Tag>
        </Flex>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Box>
            <Stat>
              <StatLabel>Total Platform Earnings</StatLabel>
              <StatNumber>{formatCurrency(commissionStats.totalCommission, 'GHS')}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {commissionStats.avgCommissionRate}% average rate
              </StatHelpText>
            </Stat>
          </Box>
          
          <Box>
            <Stat>
              <StatLabel>Commission Applied</StatLabel>
              <StatNumber>{commissionStats.commissionAppliedCount}</StatNumber>
              <StatHelpText>
                {commissionStats.pendingCommissionCount} pending
              </StatHelpText>
            </Stat>
          </Box>
          
          <Box>
            <FormControl>
              <FormLabel>Commission Rate (%)</FormLabel>
              <NumberInput
                value={filters.commissionRate}
                onChange={(value) => handleFilterChange('commissionRate', value)}
                min={0}
                max={50}
                step={0.5}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <Text fontSize="sm" color="gray.600" mt={2}>
                {COMMISSION_SETTINGS.DRIVER_SHARE}% goes to driver
              </Text>
            </FormControl>
          </Box>
        </SimpleGrid>
      </Box>
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Flex align="center" gap={2} mb={2}>
            <FiDollarSign color="#4F46E5" />
            <Text color="gray.600" fontSize="sm">Total Revenue</Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold">
            {formatCurrency(stats.totalAmount, 'GHS')}
          </Text>
          <Flex justify="space-between" mt={2}>
            <Text fontSize="xs" color="green.600">
              Passenger: {formatCurrency(stats.totalPassengerPayments, 'GHS')}
            </Text>
            <Text fontSize="xs" color="blue.600">
              Driver: {formatCurrency(stats.totalDriverPayouts, 'GHS')}
            </Text>
          </Flex>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Flex align="center" gap={2} mb={2}>
            <FiDollarSign color="#059669" />
            <Text color="gray.600" fontSize="sm">Platform Commission</Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            {formatCurrency(stats.totalCommission, 'GHS')}
          </Text>
          <Progress 
            value={commissionStats.avgCommissionRate} 
            max={50} 
            size="sm" 
            colorScheme="green" 
            mt={2}
          />
          <Text fontSize="xs" color="gray.600" mt={1}>
            Average: {commissionStats.avgCommissionRate}%
          </Text>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Flex align="center" gap={2} mb={2}>
            <FiUserCheck color="#3B82F6" />
            <Text color="gray.600" fontSize="sm">Driver Earnings</Text>
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
            {formatCurrency(stats.totalDriverEarnings, 'GHS')}
          </Text>
          <Text fontSize="xs" color="gray.600" mt={2}>
            After commission deduction
          </Text>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Flex align="center" gap={2} mb={2}>
            <FiUser color="#6B7280" />
            <Text color="gray.600" fontSize="sm">Payment Status</Text>
          </Flex>
          <Flex direction="column" gap={1} mt={2}>
            <Flex justify="space-between">
              <Badge colorScheme="green">{stats.successCount} Success</Badge>
              <Badge colorScheme="yellow">{stats.pendingCount} Pending</Badge>
            </Flex>
            <Flex justify="space-between" mt={1}>
              <Badge colorScheme="red">{stats.failedCount} Failed</Badge>
              <Badge colorScheme="purple">{stats.refundedCount} Refunded</Badge>
            </Flex>
          </Flex>
        </Box>
      </SimpleGrid>
      
      {/* Payment Type Tabs */}
      <Box bg="white" borderRadius="lg" shadow="sm" mb={6}>
        <Tabs 
          variant="enclosed" 
          colorScheme="blue"
          onChange={(index) => {
            const tabs = ['all', 'passenger', 'driver'];
            setPaymentTypeTab(tabs[index]);
            setCurrentPage(1);
          }}
        >
          <TabList>
            <Tab>All Payments</Tab>
            <Tab>Passenger Payments</Tab>
            <Tab>Driver Payouts</Tab>
          </TabList>
        </Tabs>
      </Box>
      
      {/* Filters */}
      <Box bg="white" p={4} borderRadius="lg" shadow="sm" mb={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontWeight="medium">Filters</Text>
          <Flex gap={2}>
            <IconButton
              icon={<FiFilter />}
              aria-label="Advanced filters"
              size="sm"
              onClick={onFilterOpen}
            />
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<CloseIcon />}
              onClick={clearFilters}
            >
              Clear All
            </Button>
          </Flex>
        </Flex>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search payments..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </InputGroup>
          
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          
          <Flex gap={2}>
            <InputGroup flex="1">
              <InputLeftElement pointerEvents="none">
                <CalendarIcon color="gray.300" fontSize="sm" />
              </InputLeftElement>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                placeholder="From"
              />
            </InputGroup>
            
            <InputGroup flex="1">
              <InputLeftElement pointerEvents="none">
                <CalendarIcon color="gray.300" fontSize="sm" />
              </InputLeftElement>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                placeholder="To"
              />
            </InputGroup>
          </Flex>
        </SimpleGrid>
        
        {/* Advanced filters row */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
          <Flex gap={2}>
            <Input
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              min="0"
              step="0.01"
            />
            <Input
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              min="0"
              step="0.01"
            />
          </Flex>
          
          <Select
            value={filters.currency}
            onChange={(e) => handleFilterChange('currency', e.target.value)}
          >
            <option value="all">All Currencies</option>
            <option value="GHS">Ghana Cedis (GHS)</option>
            <option value="USD">US Dollars (USD)</option>
            <option value="EUR">Euros (EUR)</option>
          </Select>
          
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => {
              // Preview commission for filtered payments
              const totalFilteredAmount = filteredPayments.reduce((sum, p) => 
                sum + (parseFloat(p.amount) || 0), 0
              );
              const commission = calculateCommissionSplit(totalFilteredAmount);
              
              toast({
                title: 'Commission Preview',
                description: `Filtered payments: ${formatCurrency(totalFilteredAmount, 'GHS')} | Commission: ${formatCurrency(commission.platformCommission, 'GHS')} (${commission.platformPercentage}%)`,
                status: 'info',
                duration: 5000,
                isClosable: true,
              });
            }}
          >
            Preview Commission
          </Button>
        </SimpleGrid>
      </Box>
      
      {/* Results Summary */}
      <Flex justify="space-between" align="center" mb={4}>
        <Text color="gray.600">
          Showing {Math.min(paginatedPayments.length, ITEMS_PER_PAGE)} of {filteredPayments.length} payments
          {paymentTypeTab !== 'all' && ` (${paymentTypeTab})`}
          {filters.search && ` for "${filters.search}"`}
        </Text>
        
        {totalPages > 1 && (
          <Flex align="center" gap={2}>
            <Button
              size="sm"
              leftIcon={<ArrowBackIcon />}
              onClick={() => handlePageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
            >
              Previous
            </Button>
            <Text fontSize="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <Button
              size="sm"
              rightIcon={<ArrowForwardIcon />}
              onClick={() => handlePageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
            >
              Next
            </Button>
          </Flex>
        )}
      </Flex>
      
      {/* Table View */}
      {viewMode === 'table' ? (
        <Box bg="white" borderRadius="lg" shadow="sm" overflow="auto" mb={6}>
          <Table variant="simple" size="md">
            <Thead bg="gray.50">
              <Tr>
                <Th>Date & Time</Th>
                <Th>Reference</Th>
                <Th isNumeric>Amount</Th>
                <Th isNumeric>Commission</Th>
                <Th isNumeric>Driver Payout</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedPayments.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center" py={10}>
                    <Box>
                      <Text mb={2}>No payments found</Text>
                      <Text fontSize="sm" color="gray.600">
                        Try adjusting your filters or search terms
                      </Text>
                    </Box>
                  </Td>
                </Tr>
              ) : (
                paginatedPayments.map((payment) => {
                  const commissionSplit = calculateCommissionSplit(payment.amount);
                  const needsCommission = (!payment.commission || payment.commission === 0) && 
                    payment.status === 'success' && 
                    payment.payment_type === PAYMENT_TYPES.RIDE_PAYMENT;
                  
                  return (
                    <Tr key={payment.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <Text fontSize="sm">
                          {formatDate(payment.created_at, 'short')}
                        </Text>
                      </Td>
                      <Td>
                        <Tooltip label={payment.paystack_reference || payment.reference_id || 'No reference'}>
                          <Text 
                            fontSize="sm" 
                            fontFamily="mono" 
                            isTruncated 
                            maxW="150px"
                          >
                            {payment.paystack_reference || payment.reference_id || '—'}
                          </Text>
                        </Tooltip>
                      </Td>
                      <Td isNumeric fontWeight="bold" fontSize="sm">
                        {formatCurrency(payment.amount, payment.currency || 'GHS')}
                      </Td>
                      <Td isNumeric fontSize="sm">
                        {payment.commission && payment.commission > 0 ? (
                          <Text color="green.600" fontWeight="medium">
                            {formatCurrency(payment.commission, payment.currency || 'GHS')}
                          </Text>
                        ) : needsCommission ? (
                          <Tooltip label="Click to apply commission">
                            <Button
                              size="xs"
                              colorScheme="yellow"
                              variant="outline"
                              onClick={() => processCommissionSplit(payment.id, payment.amount)}
                            >
                              Apply
                            </Button>
                          </Tooltip>
                        ) : (
                          <Text color="gray.500">—</Text>
                        )}
                      </Td>
                      <Td isNumeric fontSize="sm">
                        <Text color="blue.600" fontWeight="medium">
                          {formatCurrency(payment.driver_payout || commissionSplit.driverPayout, payment.currency || 'GHS')}
                        </Text>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={getStatusColor(payment.status)}
                          fontSize="xs"
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          {formatStatus(payment.status)}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<ViewIcon />}
                            aria-label="View details"
                            size="sm"
                            variant="ghost"
                            onClick={() => viewPaymentDetails(payment)}
                          />
                          
                          {payment.paystack_reference && (
                            <IconButton
                              icon={<CheckCircleIcon />}
                              aria-label="Verify payment"
                              size="sm"
                              variant="ghost"
                              colorScheme="green"
                              onClick={() => handleVerification(payment)}
                              isLoading={verifyingPayment === payment.paystack_reference}
                            />
                          )}
                          
                          {needsCommission && (
                            <IconButton
                              icon={<EditIcon />}
                              aria-label="Apply commission"
                              size="sm"
                              variant="ghost"
                              colorScheme="yellow"
                              onClick={() => processCommissionSplit(payment.id, payment.amount)}
                            />
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      ) : (
        /* Card View */
        <Flex direction="column" gap={4} mb={6}>
          {paginatedPayments.length === 0 ? (
            <Box bg="white" p={10} borderRadius="lg" shadow="sm" textAlign="center">
              <Text mb={2} fontSize="lg">No payments found</Text>
              <Text color="gray.600">
                Try adjusting your filters or search terms
              </Text>
            </Box>
          ) : (
            paginatedPayments.map((payment) => (
              <PaymentCard 
                key={payment.id} 
                payment={payment}
                onVerify={() => handleVerification(payment)}
                onApplyCommission={() => processCommissionSplit(payment.id, payment.amount)}
              />
            ))
          )}
        </Flex>
      )}
      
      {/* Advanced Filters Modal */}
      <Modal isOpen={isFilterOpen} onClose={onFilterClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Advanced Filters</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Payment Method</FormLabel>
                <Select placeholder="Select payment method">
                  <option value="mobile_money">Mobile Money</option>
                  <option value="card">Card</option>
                  <option value="cash">Cash</option>
                  <option value="wallet">Wallet</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Payment Provider</FormLabel>
                <Select placeholder="Select provider">
                  <option value="paystack">PayStack</option>
                  <option value="stripe">Stripe</option>
                  <option value="flutterwave">Flutterwave</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Has Commission Applied</FormLabel>
                <RadioGroup defaultValue="all">
                  <Stack direction="row">
                    <Radio value="all">All</Radio>
                    <Radio value="applied">Applied</Radio>
                    <Radio value="not_applied">Not Applied</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFilterClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={onFilterClose}>
              Apply Filters
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Verification Modal */}
      <Modal isOpen={isVerificationModalOpen} onClose={onVerificationModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Verify Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPayment && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Verify PayStack payment for reference: 
                  <Text as="span" fontFamily="mono" fontWeight="bold" ml={2}>
                    {selectedPayment.paystack_reference}
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
                  <Text>Amount: {formatCurrency(selectedPayment.amount, selectedPayment.currency)}</Text>
                  <Text>Status: {formatStatus(selectedPayment.status)}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onVerificationModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={() => verifyPayStackPayment(selectedPayment?.paystack_reference)}
              isLoading={verifyingPayment === selectedPayment?.paystack_reference}
            >
              Verify Payment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Payment Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>Payment Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="70vh" overflowY="auto">
            {selectedPayment ? (
              <PaymentCard 
                payment={selectedPayment} 
                onVerify={() => handleVerification(selectedPayment)}
                onApplyCommission={() => processCommissionSplit(selectedPayment.id, selectedPayment.amount)}
              />
            ) : (
              <Spinner />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Payments;