// admin-panel/src/pages/Payouts.jsx
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
  Switch,
  Stack,
  Container,
  Wrap,
  WrapItem,
  Textarea,
  Checkbox,
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
  DownloadIcon,
  CheckIcon,
  TimeIcon,
  ExternalLinkIcon,
  InfoIcon,
  LockIcon,
  UnlockIcon,
} from '@chakra-ui/icons';
import { FiFilter, FiUser, FiDollarSign, FiCreditCard, FiAlertCircle, FiShield } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Constants
const ITEMS_PER_PAGE = 15;
const PAYOUT_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  APPROVED: 'approved',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  REVERSED: 'reversed',
  CANCELLED: 'cancelled',
};

const PAYOUT_METHODS = {
  BANK_ACCOUNT: 'bank_account',
  MOBILE_MONEY: 'mobile_money',
};

const Payouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    payoutMethod: 'all',
    startDate: null,
    endDate: null,
    minAmount: '',
    maxAmount: '',
    driverId: '',
  });
  const [stats, setStats] = useState({
    totalPayouts: 0,
    totalAmount: 0,
    totalFees: 0,
    totalNetAmount: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    paidAmount: 0,
    failedAmount: 0,
    pendingCount: 0,
    approvedCount: 0,
    paidCount: 0,
    failedCount: 0,
    cashRideDebts: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutDetails, setPayoutDetails] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [bulkAction, setBulkAction] = useState([]);
  
  // WITHDRAWAL RULES - Admin sets these, NOT specific amounts
  const [withdrawalRules, setWithdrawalRules] = useState({
    processingFee: 5, // 5% processing fee
    minBalanceToKeep: 50, // ₵50 must remain in wallet
    maxWithdrawalPerRequest: 5000, // Max ₵5000 per withdrawal
    maxWithdrawalsPerDay: 3, // Max 3 withdrawals per day per driver
    autoApproveEnabled: false,
    autoApproveThreshold: 1000, // Auto-approve payouts under ₵1000
    requireVerification: true, // Payout method must be verified
  });
  
  const toast = useToast();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure();
  const { isOpen: isBulkOpen, onOpen: onBulkOpen, onClose: onBulkClose } = useDisclosure();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { isOpen: isValidationOpen, onOpen: onValidationOpen, onClose: onValidationClose } = useDisclosure();
  
  // Safe currency formatting
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
    }
    
    return `${numericAmount.toFixed(2)} ${currency}`;
  }, []);

  // Safe date formatting
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
        });
      } else if (format === 'date-only') {
        return date.toLocaleDateString('en-GH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } else {
        return date.toLocaleDateString('en-GH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date error';
    }
  }, []);

  // Status color mapping
  const getStatusColor = useCallback((status) => {
    if (!status) return 'gray';
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
      case 'reviewing':
        return 'yellow';
      case 'approved':
        return 'blue';
      case 'processing':
        return 'purple';
      case 'paid':
        return 'green';
      case 'failed':
        return 'red';
      case 'reversed':
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  }, []);

  // Format status for display
  const formatStatus = useCallback((status) => {
    if (!status) return 'Unknown';
    
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'pending': return 'Pending';
      case 'reviewing': return 'Under Review';
      case 'approved': return 'Approved';
      case 'processing': return 'Processing';
      case 'paid': return 'Paid';
      case 'failed': return 'Failed';
      case 'reversed': return 'Reversed';
      case 'cancelled': return 'Cancelled';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }, []);

  // Calculate net amount and fees BASED ON RULES
  const calculatePayoutDetails = useCallback((requestedAmount) => {
    const amount = parseFloat(requestedAmount) || 0;
    const feeRate = withdrawalRules.processingFee || 5;
    
    // Calculate processing fee
    const feeAmount = (amount * feeRate) / 100;
    const netAmount = amount - feeAmount;
    
    return {
      requestedAmount: parseFloat(amount.toFixed(2)),
      processingFee: parseFloat(feeAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      feePercentage: feeRate,
    };
  }, [withdrawalRules.processingFee]);

  // VALIDATE WITHDRAWAL REQUEST against rules
  const validateWithdrawalRequest = useCallback(async (payout) => {
    const validationErrors = [];
    const warnings = [];
    
    try {
      // 1. Get driver's current wallet balance
      const { data: driverWallet, error: walletError } = await supabase
        .from('driver_wallets')
        .select('available_balance, total_earnings, pending_withdrawals, cash_ride_debts')
        .eq('driver_id', payout.driver_id)
        .single();
      
      if (walletError) {
        validationErrors.push('Could not retrieve driver wallet balance');
        return { isValid: false, errors: validationErrors, warnings };
      }
      
      const availableBalance = parseFloat(driverWallet.available_balance) || 0;
      const cashRideDebts = parseFloat(driverWallet.cash_ride_debts) || 0;
      const requestedAmount = parseFloat(payout.requested_amount) || 0;
      
      // 2. Check if payout method is verified
      if (withdrawalRules.requireVerification && payout.payout_method?.verification_status !== 'verified') {
        validationErrors.push('Payout method is not verified');
      }
      
      // 3. Check minimum balance rule
      const minBalanceToKeep = withdrawalRules.minBalanceToKeep || 50;
      const maxWithdrawable = availableBalance - minBalanceToKeep;
      
      if (requestedAmount > maxWithdrawable) {
        validationErrors.push(
          `Cannot withdraw ${formatCurrency(requestedAmount)}. ` +
          `Maximum withdrawable: ${formatCurrency(maxWithdrawable)} ` +
          `(must keep minimum ${formatCurrency(minBalanceToKeep)} in wallet)`
        );
      }
      
      // 4. Check max withdrawal per request
      const maxPerRequest = withdrawalRules.maxWithdrawalPerRequest || 5000;
      if (requestedAmount > maxPerRequest) {
        validationErrors.push(
          `Cannot withdraw ${formatCurrency(requestedAmount)}. ` +
          `Maximum per withdrawal: ${formatCurrency(maxPerRequest)}`
        );
      }
      
      // 5. Check cash ride debts
      if (cashRideDebts > 0) {
        warnings.push(
          `Driver has ${formatCurrency(cashRideDebts)} in cash ride debts. ` +
          `Platform commissions will be deducted from wallet.`
        );
        
        // Check if withdrawal would leave enough for cash ride debts
        const balanceAfterWithdrawal = availableBalance - requestedAmount;
        if (balanceAfterWithdrawal < cashRideDebts) {
          warnings.push(
            `Warning: After withdrawal, balance (${formatCurrency(balanceAfterWithdrawal)}) ` +
            `may be insufficient for cash ride debts (${formatCurrency(cashRideDebts)})`
          );
        }
      }
      
      // 6. Check driver account status
      if (payout.driver?.account_status !== 'approved') {
        validationErrors.push('Driver account is not approved');
      }
      
      // 7. Check if driver has reached daily withdrawal limit
      const today = new Date().toISOString().split('T')[0];
      const { count: todayWithdrawals } = await supabase
        .from('payouts')
        .select('*', { count: 'exact', head: true })
        .eq('driver_id', payout.driver_id)
        .eq('status', PAYOUT_STATUS.PAID)
        .gte('paid_at', `${today}T00:00:00`)
        .lte('paid_at', `${today}T23:59:59`);
      
      const maxDaily = withdrawalRules.maxWithdrawalsPerDay || 3;
      if (todayWithdrawals >= maxDaily) {
        validationErrors.push(
          `Driver has reached daily withdrawal limit (${maxDaily} withdrawals per day)`
        );
      }
      
      return {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
        warnings,
        driverBalance: availableBalance,
        cashRideDebts,
        maxWithdrawable,
        todayWithdrawals: todayWithdrawals || 0,
      };
      
    } catch (error) {
      console.error('Validation error:', error);
      validationErrors.push('Validation error: ' + error.message);
      return { isValid: false, errors: validationErrors, warnings };
    }
  }, [withdrawalRules, formatCurrency]);

  // Fetch payouts with all related data - FIXED VERSION
  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch payouts with driver and payout method details ONLY
      const { data, error: fetchError, count } = await supabase
        .from('payouts')
        .select(`
          *,
          driver:driver_id (
            id,
            full_name,
            email,
            phone,
            account_status,
            created_at
          ),
          payout_method:payout_methods!payout_method_id (
            id,
            method_type,
            provider,
            account_name,
            account_number,
            bank_name,
            mobile_money_network,
            is_default,
            verification_status
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }
      
      // Get related data for each payout separately to avoid join issues
      const enhancedPayouts = await Promise.all(
        (data || []).map(async (payout) => {
          let walletTransactionData = null;
          let driverWalletData = null;
          
          try {
            // Get wallet transaction data separately
            const { data: walletTx } = await supabase
              .from('wallet_transactions')
              .select('id, amount, balance_before, balance_after, created_at')
              .eq('external_reference', payout.gateway_reference)
              .single();
            
            if (walletTx) {
              walletTransactionData = walletTx;
            }
          } catch (error) {
            // No wallet transaction found, that's okay
          }
          
          try {
            // Get driver wallet data separately
            const { data: driverWallet } = await supabase
              .from('driver_wallets')
              .select('available_balance, total_earnings, pending_withdrawals, cash_ride_debts')
              .eq('driver_id', payout.driver_id)
              .single();
            
            if (driverWallet) {
              driverWalletData = driverWallet;
            }
          } catch (error) {
            // No driver wallet found, that's okay
          }
          
          return {
            ...payout,
            wallet_transaction: walletTransactionData,
            driver_wallet: driverWalletData
          };
        })
      );
      
      setPayouts(enhancedPayouts);
      
      // Calculate comprehensive stats including cash ride debts
      const stats = {
        totalPayouts: count || 0,
        totalAmount: 0,
        totalFees: 0,
        totalNetAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        paidAmount: 0,
        failedAmount: 0,
        pendingCount: 0,
        approvedCount: 0,
        paidCount: 0,
        failedCount: 0,
        cashRideDebts: 0,
      };
      
      enhancedPayouts?.forEach(payout => {
        const requestedAmount = parseFloat(payout.requested_amount) || 0;
        const processingFee = parseFloat(payout.processing_fee) || 0;
        const netAmount = parseFloat(payout.net_amount) || 0;
        
        stats.totalAmount += requestedAmount;
        stats.totalFees += processingFee;
        stats.totalNetAmount += netAmount;
        
        // Add cash ride debts from driver wallet
        if (payout.driver_wallet?.cash_ride_debts) {
          stats.cashRideDebts += parseFloat(payout.driver_wallet.cash_ride_debts);
        }
        
        // Count by status
        switch (payout.status) {
          case PAYOUT_STATUS.PENDING:
          case PAYOUT_STATUS.REVIEWING:
            stats.pendingAmount += requestedAmount;
            stats.pendingCount++;
            break;
          case PAYOUT_STATUS.APPROVED:
            stats.approvedAmount += requestedAmount;
            stats.approvedCount++;
            break;
          case PAYOUT_STATUS.PAID:
            stats.paidAmount += netAmount;
            stats.paidCount++;
            break;
          case PAYOUT_STATUS.FAILED:
          case PAYOUT_STATUS.REVERSED:
            stats.failedAmount += requestedAmount;
            stats.failedCount++;
            break;
        }
      });
      
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setError(error.message || 'Failed to fetch payouts');
      
      toast({
        title: 'Failed to load payouts',
        description: error.message || 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load detailed payout information with validation - FIXED VERSION
  const loadPayoutDetails = useCallback(async (payoutId) => {
    try {
      // First get basic payout data
      const { data: payout, error: payoutError } = await supabase
        .from('payouts')
        .select(`
          *,
          driver:driver_id (
            id,
            full_name,
            email,
            phone,
            account_status,
            created_at,
            last_login_at
          ),
          payout_method:payout_methods!payout_method_id (
            id,
            method_type,
            provider,
            account_name,
            account_number,
            bank_name,
            mobile_money_network,
            is_default,
            verification_status,
            created_at
          )
        `)
        .eq('id', payoutId)
        .single();
      
      if (payoutError) throw payoutError;
      
      if (payout) {
        // Get related data separately
        let walletTransactionData = null;
        let paystackTransactionData = null;
        let adminProcessedByData = null;
        let driverWalletData = null;
        
        try {
          // Get wallet transaction data separately
          const { data: walletTx } = await supabase
            .from('wallet_transactions')
            .select('id, transaction_type, amount, balance_before, balance_after, description, created_at')
            .eq('external_reference', payout.gateway_reference)
            .single();
          
          if (walletTx) {
            walletTransactionData = walletTx;
          }
        } catch (error) {
          // No wallet transaction found, that's okay
        }
        
        try {
          // Get paystack transaction data separately
          const { data: paystackTx } = await supabase
            .from('paystack_transactions')
            .select('id, paystack_reference, paystack_status, gateway_response, amount, currency, created_at, paid_at')
            .eq('gateway_reference', payout.gateway_reference)
            .single();
          
          if (paystackTx) {
            paystackTransactionData = paystackTx;
          }
        } catch (error) {
          // No paystack transaction found, that's okay
        }
        
        try {
          // Get admin processed by data separately
          if (payout.processed_by) {
            const { data: admin } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .eq('id', payout.processed_by)
              .single();
            
            if (admin) {
              adminProcessedByData = admin;
            }
          }
        } catch (error) {
          // No admin data found, that's okay
        }
        
        try {
          // Get driver wallet data separately
          const { data: driverWallet } = await supabase
            .from('driver_wallets')
            .select('available_balance, total_earnings, pending_withdrawals, cash_ride_debts, total_withdrawn')
            .eq('driver_id', payout.driver_id)
            .single();
          
          if (driverWallet) {
            driverWalletData = driverWallet;
          }
        } catch (error) {
          // No driver wallet found, that's okay
        }
        
        // Combine all data
        const combinedData = {
          ...payout,
          wallet_transaction: walletTransactionData,
          paystack_transaction: paystackTransactionData,
          admin_processed_by: adminProcessedByData,
          driver_wallet: driverWalletData
        };
        
        setPayoutDetails(combinedData);
        setSelectedPayout(combinedData);
        
        // Run validation and show results
        const validation = await validateWithdrawalRequest(combinedData);
        combinedData.validation = validation;
        
        onDetailsOpen();
      }
      
    } catch (error) {
      console.error('Error loading payout details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payout details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [onDetailsOpen, toast, validateWithdrawalRequest]);

  // Update payout status WITH VALIDATION
  const updatePayoutStatus = useCallback(async (payoutId, newStatus, adminNotes = null) => {
    try {
      setProcessingAction(payoutId);
      
      // Get payout details first
      const { data: payout, error: payoutError } = await supabase
        .from('payouts')
        .select('*, driver:driver_id(*), payout_method:payout_methods!payout_method_id(*)')
        .eq('id', payoutId)
        .single();
      
      if (payoutError) throw payoutError;
      
      // VALIDATE before approving
      if (newStatus === PAYOUT_STATUS.APPROVED) {
        const validation = await validateWithdrawalRequest(payout);
        
        if (!validation.isValid) {
          toast({
            title: 'Validation Failed',
            description: validation.errors.join('. '),
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          
          // Show validation modal with details
          setSelectedPayout({ ...payout, validation });
          onValidationOpen();
          return;
        }
        
        // Add validation warnings to admin notes
        if (validation.warnings.length > 0) {
          adminNotes = adminNotes 
            ? `${adminNotes}. Warnings: ${validation.warnings.join('. ')}`
            : `Warnings: ${validation.warnings.join('. ')}`;
        }
      }
      
      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Admin authentication required');
      }
      
      // Update payout status using RPC function
      const { data, error } = await supabase.rpc('update_payout_status', {
        p_payout_id: payoutId,
        p_new_status: newStatus,
        p_admin_id: user.id,
        p_admin_notes: adminNotes,
      });
      
      if (error) throw error;
      
      // If approved, initiate Paystack transfer
      if (newStatus === PAYOUT_STATUS.APPROVED) {
        await initiatePaystackTransfer(payoutId);
      }
      
      toast({
        title: 'Status Updated',
        description: `Payout ${newStatus} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh data
      await fetchPayouts();
      onActionClose();
      
    } catch (error) {
      console.error('Error updating payout status:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update payout status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingAction(null);
    }
  }, [fetchPayouts, onActionClose, toast, validateWithdrawalRequest, onValidationOpen]);

  // Initiate Paystack transfer
  const initiatePaystackTransfer = useCallback(async (payoutId) => {
    try {
      // Get payout details
      const { data: payout, error: payoutError } = await supabase
        .from('payouts')
        .select(`
          *,
          payout_method:payout_methods!payout_method_id (*),
          driver:driver_id (*)
        `)
        .eq('id', payoutId)
        .single();
      
      if (payoutError) throw payoutError;
      
      // Create Paystack transfer
      const response = await fetch('/api/paystack/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payout_id: payout.id,
          amount: payout.net_amount * 100, // Convert to pesewas
          recipient: payout.payout_method.account_number,
          bank_code: payout.payout_method.bank_code || 'GH',
          reason: `Driver payout for ${payout.driver.full_name}`,
          reference: `PAYOUT_${payout.id}_${Date.now()}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Paystack transfer failed');
      }
      
      const result = await response.json();
      
      // Update payout with Paystack reference
      await supabase
        .from('payouts')
        .update({
          gateway_reference: result.data.reference,
          gateway_status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payoutId);
      
      toast({
        title: 'Transfer Initiated',
        description: 'Paystack transfer has been initiated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error initiating Paystack transfer:', error);
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Failed to initiate transfer',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast]);

  // Bulk update payouts WITH VALIDATION
  const bulkUpdatePayouts = useCallback(async (payoutIds, action, notes = null) => {
    try {
      setProcessingAction('bulk');
      
      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Admin authentication required');
      }
      
      let successCount = 0;
      let errorCount = 0;
      let validationErrors = [];
      
      for (const payoutId of payoutIds) {
        try {
          // For approval, validate each payout
          if (action === PAYOUT_STATUS.APPROVED) {
            const { data: payout } = await supabase
              .from('payouts')
              .select('*, driver:driver_id(*), payout_method:payout_methods!payout_method_id(*)')
              .eq('id', payoutId)
              .single();
            
            const validation = await validateWithdrawalRequest(payout);
            
            if (!validation.isValid) {
              validationErrors.push(`Payout ${payoutId}: ${validation.errors.join('. ')}`);
              errorCount++;
              continue;
            }
          }
          
          await supabase.rpc('update_payout_status', {
            p_payout_id: payoutId,
            p_new_status: action,
            p_admin_id: user.id,
            p_admin_notes: notes,
          });
          
          // If approved, initiate transfer
          if (action === PAYOUT_STATUS.APPROVED) {
            await initiatePaystackTransfer(payoutId);
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error updating payout ${payoutId}:`, error);
          errorCount++;
        }
      }
      
      if (validationErrors.length > 0) {
        toast({
          title: 'Bulk Update with Validation Errors',
          description: `${successCount} payouts approved, ${errorCount} failed. Validation errors: ${validationErrors.slice(0, 3).join('; ')}`,
          status: 'warning',
          duration: 8000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Bulk Update Complete',
          description: `${successCount} payouts updated successfully, ${errorCount} failed`,
          status: successCount > 0 ? 'success' : 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Refresh data
      await fetchPayouts();
      onBulkClose();
      setBulkAction([]);
      
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast({
        title: 'Bulk Update Failed',
        description: error.message || 'Failed to update payouts',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingAction(null);
    }
  }, [fetchPayouts, initiatePaystackTransfer, onBulkClose, toast, validateWithdrawalRequest]);

  // Apply auto-approve rules WITH VALIDATION
  const applyAutoApprove = useCallback(async () => {
    if (!withdrawalRules.autoApproveEnabled) return;
    
    try {
      const { data: pendingPayouts, error } = await supabase
        .from('payouts')
        .select('*, driver:driver_id(*), payout_method:payout_methods!payout_method_id(*)')
        .in('status', [PAYOUT_STATUS.PENDING, PAYOUT_STATUS.REVIEWING])
        .lte('requested_amount', withdrawalRules.autoApproveThreshold || 1000);
      
      if (error) throw error;
      
      if (pendingPayouts.length > 0) {
        let approvedCount = 0;
        let failedCount = 0;
        
        for (const payout of pendingPayouts) {
          try {
            // Validate each payout before auto-approving
            const validation = await validateWithdrawalRequest(payout);
            
            if (validation.isValid) {
              await supabase.rpc('update_payout_status', {
                p_payout_id: payout.id,
                p_new_status: PAYOUT_STATUS.APPROVED,
                p_admin_id: 'system',
                p_admin_notes: 'Auto-approved by system',
              });
              
              await initiatePaystackTransfer(payout.id);
              approvedCount++;
            } else {
              console.log(`Skipping auto-approve for payout ${payout.id}:`, validation.errors);
              failedCount++;
            }
          } catch (error) {
            console.error(`Error auto-approving payout ${payout.id}:`, error);
            failedCount++;
          }
        }
        
        toast({
          title: 'Auto-Approval Complete',
          description: `${approvedCount} payouts auto-approved, ${failedCount} failed validation`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh data
        await fetchPayouts();
      }
    } catch (error) {
      console.error('Auto-approve error:', error);
      toast({
        title: 'Auto-Approval Failed',
        description: error.message || 'Failed to auto-approve payouts',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [withdrawalRules.autoApproveEnabled, withdrawalRules.autoApproveThreshold, fetchPayouts, initiatePaystackTransfer, toast, validateWithdrawalRequest]);

  // Save withdrawal rules
  const saveWithdrawalRules = useCallback(async () => {
    try {
      // In production, save to database
      // For now, just update state
      toast({
        title: 'Settings Saved',
        description: 'Withdrawal rules updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      onSettingsClose();
    } catch (error) {
      console.error('Error saving rules:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save withdrawal rules',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [onSettingsClose, toast]);

  // Handle filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger filter recalculation
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    fetchPayouts();
    
    // Set up real-time subscription for payout changes
    const channel = supabase
      .channel('payouts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payouts'
        },
        () => {
          fetchPayouts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayouts]);

  // Filter payouts based on current filters
  const filteredPayouts = useMemo(() => {
    let result = [...payouts];
    
    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      result = result.filter(payout => {
        return (
          payout.driver?.full_name?.toLowerCase().includes(searchTerm) ||
          payout.driver?.email?.toLowerCase().includes(searchTerm) ||
          payout.id?.toString().includes(searchTerm) ||
          payout.gateway_reference?.toLowerCase().includes(searchTerm) ||
          payout.driver?.phone?.includes(searchTerm)
        );
      });
    }
    
    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(payout => payout.status === filters.status);
    }
    
    // Tab filter
    if (selectedTab !== 'all') {
      result = result.filter(payout => payout.status === selectedTab);
    }
    
    // Payout method filter
    if (filters.payoutMethod !== 'all') {
      result = result.filter(payout => 
        payout.payout_method?.method_type === filters.payoutMethod
      );
    }
    
    // Date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(payout => {
        const payoutDate = new Date(payout.created_at);
        return payoutDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(payout => {
        const payoutDate = new Date(payout.created_at);
        return payoutDate <= endDate;
      });
    }
    
    // Amount filters
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      if (!isNaN(minAmount)) {
        result = result.filter(payout => {
          const amount = parseFloat(payout.requested_amount) || 0;
          return amount >= minAmount;
        });
      }
    }
    
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      if (!isNaN(maxAmount)) {
        result = result.filter(payout => {
          const amount = parseFloat(payout.requested_amount) || 0;
          return amount <= maxAmount;
        });
      }
    }
    
    // Driver ID filter
    if (filters.driverId) {
      result = result.filter(payout => payout.driver_id === filters.driverId);
    }
    
    return result;
  }, [payouts, filters, selectedTab]);

  // Export to CSV - FIXED: Now uses filteredPayouts which is properly declared
  const exportToCSV = useCallback(() => {
    try {
      if (!filteredPayouts || filteredPayouts.length === 0) {
        toast({
          title: 'No data to export',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const headers = [
        'Payout ID',
        'Date',
        'Driver Name',
        'Driver Email',
        'Driver Phone',
        'Payout Method',
        'Account Details',
        'Requested Amount (GHS)',
        'Processing Fee (GHS)',
        'Net Amount (GHS)',
        'Status',
        'Driver Balance Before',
        'Cash Ride Debts',
        'Processed By',
        'Processed At',
        'Gateway Reference',
        'Gateway Status',
        'Admin Notes',
      ];
      
      const csvData = filteredPayouts.map(payout => {
        const payoutMethod = payout.payout_method;
        let accountDetails = '';
        
        if (payoutMethod?.method_type === PAYOUT_METHODS.BANK_ACCOUNT) {
          accountDetails = `${payoutMethod.bank_name || ''} - ${payoutMethod.account_number || ''}`;
        } else if (payoutMethod?.method_type === PAYOUT_METHODS.MOBILE_MONEY) {
          accountDetails = `${payoutMethod.mobile_money_network || ''} - ${payoutMethod.account_number || ''}`;
        }
        
        const balanceBefore = payout.wallet_transaction?.balance_before || 0;
        const cashDebts = payout.driver_wallet?.cash_ride_debts || 0;
        
        return [
          payout.id,
          new Date(payout.created_at).toISOString().split('T')[0],
          payout.driver?.full_name || '',
          payout.driver?.email || '',
          payout.driver?.phone || '',
          payoutMethod?.method_type || '',
          accountDetails,
          payout.requested_amount || 0,
          payout.processing_fee || 0,
          payout.net_amount || 0,
          payout.status,
          balanceBefore,
          cashDebts,
          payout.processed_by_name || '',
          payout.processed_at || '',
          payout.gateway_reference || '',
          payout.gateway_status || '',
          payout.admin_notes || '',
        ];
      });
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download', 
        `payouts_export_${new Date().toISOString().split('T')[0]}_${filteredPayouts.length}_records.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: `${filteredPayouts.length} records exported`,
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
  }, [filteredPayouts, toast]);

  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value 
    }));
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      payoutMethod: 'all',
      startDate: null,
      endDate: null,
      minAmount: '',
      maxAmount: '',
      driverId: '',
    });
    setSelectedTab('all');
    setCurrentPage(1);
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPayouts();
    setIsRefreshing(false);
    
    toast({
      title: 'Data refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [fetchPayouts, toast]);

  // Handle bulk selection
  const handleBulkSelect = useCallback((payoutId, checked) => {
    if (checked) {
      setBulkAction(prev => [...prev, payoutId]);
    } else {
      setBulkAction(prev => prev.filter(id => id !== payoutId));
    }
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE);
  const paginatedPayouts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayouts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPayouts, currentPage]);

  // Select all on current page
  const selectAllOnPage = useCallback(() => {
    const pagePayouts = paginatedPayouts.map(p => p.id);
    if (bulkAction.length === pagePayouts.length) {
      setBulkAction([]);
    } else {
      setBulkAction(pagePayouts);
    }
  }, [paginatedPayouts, bulkAction.length]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get status options based on current payout
  const getStatusOptions = useCallback((currentStatus) => {
    const options = [];
    
    switch (currentStatus) {
      case PAYOUT_STATUS.PENDING:
      case PAYOUT_STATUS.REVIEWING:
        options.push(
          { value: PAYOUT_STATUS.APPROVED, label: 'Approve', color: 'green', icon: CheckIcon },
          { value: PAYOUT_STATUS.CANCELLED, label: 'Cancel', color: 'red', icon: CloseIcon }
        );
        break;
      case PAYOUT_STATUS.APPROVED:
        options.push(
          { value: PAYOUT_STATUS.PROCESSING, label: 'Start Processing', color: 'purple', icon: TimeIcon },
          { value: PAYOUT_STATUS.CANCELLED, label: 'Cancel', color: 'red', icon: CloseIcon }
        );
        break;
      case PAYOUT_STATUS.PROCESSING:
        options.push(
          { value: PAYOUT_STATUS.PAID, label: 'Mark as Paid', color: 'green', icon: CheckIcon },
          { value: PAYOUT_STATUS.FAILED, label: 'Mark as Failed', color: 'red', icon: CloseIcon }
        );
        break;
      case PAYOUT_STATUS.PAID:
        options.push(
          { value: PAYOUT_STATUS.REVERSED, label: 'Reverse', color: 'orange', icon: RepeatIcon }
        );
        break;
      case PAYOUT_STATUS.FAILED:
        options.push(
          { value: PAYOUT_STATUS.PROCESSING, label: 'Retry', color: 'blue', icon: RepeatIcon },
          { value: PAYOUT_STATUS.CANCELLED, label: 'Cancel', color: 'gray', icon: CloseIcon }
        );
        break;
    }
    
    return options;
  }, []);

  // Check if payout is eligible for auto-approval
  const isEligibleForAutoApprove = useCallback((payout) => {
    if (!withdrawalRules.autoApproveEnabled) return false;
    
    const requestedAmount = parseFloat(payout.requested_amount) || 0;
    const threshold = withdrawalRules.autoApproveThreshold || 1000;
    
    return requestedAmount <= threshold && 
           payout.status === PAYOUT_STATUS.PENDING &&
           payout.payout_method?.verification_status === 'verified' &&
           payout.driver?.account_status === 'approved';
  }, [withdrawalRules]);

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
          <Heading size="lg" mb={2}>Driver Payouts Management</Heading>
          <Text color="gray.600">
            {stats.totalPayouts} total payouts • {stats.paidCount} paid • 
            Total Paid: {formatCurrency(stats.paidAmount, 'GHS')} • 
            Cash Ride Debts: {formatCurrency(stats.cashRideDebts, 'GHS')}
          </Text>
        </Box>
        
        <Flex gap={3}>
          <Button
            leftIcon={<FiAlertCircle />}
            colorScheme="blue"
            onClick={applyAutoApprove}
            isDisabled={!withdrawalRules.autoApproveEnabled || stats.pendingCount === 0}
          >
            Auto-Approve ({stats.pendingCount})
          </Button>
          
          <Button
            leftIcon={<FiShield />}
            colorScheme="teal"
            onClick={onSettingsOpen}
          >
            Withdrawal Rules
          </Button>
          
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
            isDisabled={!filteredPayouts || filteredPayouts.length === 0}
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
            <AlertTitle>Error loading payouts</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
          <Button size="sm" onClick={fetchPayouts}>
            Retry
          </Button>
        </Alert>
      )}
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4} mb={6}>
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Total Payouts</StatLabel>
            <StatNumber>{stats.totalPayouts}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {stats.paidCount} paid
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Total Amount</StatLabel>
            <StatNumber>{formatCurrency(stats.totalAmount, 'GHS')}</StatNumber>
            <StatHelpText>
              Net: {formatCurrency(stats.totalNetAmount, 'GHS')}
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Pending Payouts</StatLabel>
            <StatNumber>{stats.pendingCount}</StatNumber>
            <StatHelpText>
              Amount: {formatCurrency(stats.pendingAmount, 'GHS')}
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Platform Fees</StatLabel>
            <StatNumber color="green.600">{formatCurrency(stats.totalFees, 'GHS')}</StatNumber>
            <StatHelpText>
              {withdrawalRules.processingFee}% processing fee
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Cash Ride Debts</StatLabel>
            <StatNumber color="orange.600">{formatCurrency(stats.cashRideDebts, 'GHS')}</StatNumber>
            <StatHelpText>
              For platform commission
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>
      
      {/* Status Tabs */}
      <Box bg="white" borderRadius="lg" shadow="sm" mb={6}>
        <Tabs 
          variant="enclosed" 
          colorScheme="blue"
          onChange={(index) => {
            const tabs = ['all', PAYOUT_STATUS.PENDING, PAYOUT_STATUS.APPROVED, PAYOUT_STATUS.PAID, PAYOUT_STATUS.FAILED];
            setSelectedTab(tabs[index]);
            setCurrentPage(1);
          }}
        >
          <TabList>
            <Tab>All Payouts</Tab>
            <Tab>
              Pending ({stats.pendingCount})
            </Tab>
            <Tab>
              Approved ({stats.approvedCount})
            </Tab>
            <Tab>
              Paid ({stats.paidCount})
            </Tab>
            <Tab>
              Failed ({stats.failedCount})
            </Tab>
          </TabList>
        </Tabs>
      </Box>
      
      {/* Bulk Actions Bar */}
      {bulkAction.length > 0 && (
        <Box bg="blue.50" p={4} borderRadius="lg" mb={6}>
          <Flex justify="space-between" align="center">
            <Text fontWeight="medium">
              {bulkAction.length} payout(s) selected
            </Text>
            <Flex gap={2}>
              <Button
                size="sm"
                colorScheme="green"
                leftIcon={<CheckIcon />}
                onClick={() => onBulkOpen()}
              >
                Approve Selected
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                leftIcon={<CloseIcon />}
                onClick={() => bulkUpdatePayouts(bulkAction, PAYOUT_STATUS.CANCELLED, 'Bulk cancelled by admin')}
              >
                Cancel Selected
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBulkAction([])}
              >
                Clear Selection
              </Button>
            </Flex>
          </Flex>
        </Box>
      )}
      
      {/* Filters */}
      <Box bg="white" p={4} borderRadius="lg" shadow="sm" mb={6} width="100%">
        <Flex justify="space-between" align="center" mb={4}>
          <Text fontWeight="medium">Filters</Text>
          <Flex gap={2}>
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
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} width="100%">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search by driver name, email, phone, or reference..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              width="100%"
            />
          </InputGroup>
          
          <Select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            width="100%"
          >
            <option value="all">All Status</option>
            <option value={PAYOUT_STATUS.PENDING}>Pending</option>
            <option value={PAYOUT_STATUS.REVIEWING}>Reviewing</option>
            <option value={PAYOUT_STATUS.APPROVED}>Approved</option>
            <option value={PAYOUT_STATUS.PROCESSING}>Processing</option>
            <option value={PAYOUT_STATUS.PAID}>Paid</option>
            <option value={PAYOUT_STATUS.FAILED}>Failed</option>
            <option value={PAYOUT_STATUS.CANCELLED}>Cancelled</option>
          </Select>
          
          <Select
            value={filters.payoutMethod}
            onChange={(e) => handleFilterChange('payoutMethod', e.target.value)}
            width="100%"
          >
            <option value="all">All Methods</option>
            <option value={PAYOUT_METHODS.BANK_ACCOUNT}>Bank Account</option>
            <option value={PAYOUT_METHODS.MOBILE_MONEY}>Mobile Money</option>
          </Select>
        </SimpleGrid>
        
        {/* Advanced filters row */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mt={4} width="100%">
          <Wrap spacing={2} width="100%">
            <WrapItem flex="1" minW="120px">
              <InputGroup width="100%">
                <InputLeftElement pointerEvents="none">
                  <CalendarIcon color="gray.300" fontSize="sm" />
                </InputLeftElement>
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date) => handleFilterChange('startDate', date)}
                  placeholderText="Start Date"
                  className="chakra-input"
                  customInput={
                    <Input placeholder="Start Date" width="100%" />
                  }
                />
              </InputGroup>
            </WrapItem>
            <WrapItem flex="1" minW="120px">
              <InputGroup width="100%">
                <InputLeftElement pointerEvents="none">
                  <CalendarIcon color="gray.300" fontSize="sm" />
                </InputLeftElement>
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date) => handleFilterChange('endDate', date)}
                  placeholderText="End Date"
                  className="chakra-input"
                  customInput={
                    <Input placeholder="End Date" width="100%" />
                  }
                />
              </InputGroup>
            </WrapItem>
          </Wrap>
          
          <Wrap spacing={2} width="100%">
            <WrapItem flex="1" minW="120px">
              <Input
                type="number"
                placeholder="Min Amount"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                min="0"
                step="0.01"
                width="100%"
              />
            </WrapItem>
            <WrapItem flex="1" minW="120px">
              <Input
                type="number"
                placeholder="Max Amount"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                min="0"
                step="0.01"
                width="100%"
              />
            </WrapItem>
          </Wrap>
          
          <Input
            type="text"
            placeholder="Driver ID or Phone"
            value={filters.driverId}
            onChange={(e) => handleFilterChange('driverId', e.target.value)}
            width="100%"
          />
          
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => {
              // Preview bulk action
              if (bulkAction.length > 0) {
                onBulkOpen();
              }
            }}
            isDisabled={bulkAction.length === 0}
            width="100%"
          >
            Bulk Actions ({bulkAction.length})
          </Button>
        </SimpleGrid>
      </Box>
      
      {/* Results Summary */}
      <Flex justify="space-between" align="center" mb={4} width="100%">
        <Text color="gray.600">
          Showing {Math.min(paginatedPayouts.length, ITEMS_PER_PAGE)} of {filteredPayouts.length} payouts
          {selectedTab !== 'all' && ` (${formatStatus(selectedTab)})`}
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
      
      {/* Payouts Table */}
      <Box bg="white" borderRadius="lg" shadow="sm" overflow="auto" mb={6} width="100%">
        <Table variant="simple" size="md">
          <Thead bg="gray.50">
            <Tr>
              <Th width="50px">
                <Checkbox
                  isChecked={bulkAction.length === paginatedPayouts.length && paginatedPayouts.length > 0}
                  onChange={selectAllOnPage}
                />
              </Th>
              <Th>Date</Th>
              <Th>Driver</Th>
              <Th>Payout Method</Th>
              <Th isNumeric>Requested</Th>
              <Th isNumeric>Fee</Th>
              <Th isNumeric>Net Amount</Th>
              <Th>Driver Balance</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {paginatedPayouts.length === 0 ? (
              <Tr>
                <Td colSpan={10} textAlign="center" py={10}>
                  <Box>
                    <Text mb={2}>No payouts found</Text>
                    <Text fontSize="sm" color="gray.600">
                      Try adjusting your filters or search terms
                    </Text>
                  </Box>
                </Td>
              </Tr>
            ) : (
              paginatedPayouts.map((payout) => {
                const payoutDetails = calculatePayoutDetails(payout.requested_amount);
                const statusOptions = getStatusOptions(payout.status);
                const driverBalance = payout.driver_wallet?.available_balance || 0;
                const cashDebts = payout.driver_wallet?.cash_ride_debts || 0;
                const eligibleForAutoApprove = isEligibleForAutoApprove(payout);
                
                return (
                  <Tr key={payout.id} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <Checkbox
                        isChecked={bulkAction.includes(payout.id)}
                        onChange={(e) => handleBulkSelect(payout.id, e.target.checked)}
                      />
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {formatDate(payout.created_at, 'short')}
                      </Text>
                    </Td>
                    <Td>
                      <Box>
                        <Text fontWeight="medium" fontSize="sm">
                          {payout.driver?.full_name || 'Unknown Driver'}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {payout.driver?.email || 'No email'}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {payout.driver?.phone || 'No phone'}
                        </Text>
                        {payout.driver?.account_status !== 'approved' && (
                          <Badge colorScheme="red" size="xs">Not Approved</Badge>
                        )}
                      </Box>
                    </Td>
                    <Td>
                      <Box>
                        <Text fontSize="sm">
                          {payout.payout_method?.method_type === PAYOUT_METHODS.BANK_ACCOUNT ? 'Bank' : 'Mobile Money'}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {payout.payout_method?.provider || 'N/A'}
                        </Text>
                        {payout.payout_method?.verification_status === 'verified' ? (
                          <Badge colorScheme="green" size="xs">Verified</Badge>
                        ) : (
                          <Badge colorScheme="red" size="xs">Not Verified</Badge>
                        )}
                      </Box>
                    </Td>
                    <Td isNumeric fontWeight="bold" fontSize="sm">
                      {formatCurrency(payout.requested_amount, 'GHS')}
                    </Td>
                    <Td isNumeric fontSize="sm" color="green.600">
                      {formatCurrency(payout.processing_fee || payoutDetails.processingFee, 'GHS')}
                      <Text fontSize="xs">({payoutDetails.feePercentage}%)</Text>
                    </Td>
                    <Td isNumeric fontSize="sm" fontWeight="bold" color="blue.600">
                      {formatCurrency(payout.net_amount || payoutDetails.netAmount, 'GHS')}
                    </Td>
                    <Td>
                      <Box>
                        <Text fontSize="sm" fontWeight="medium">
                          {formatCurrency(driverBalance, 'GHS')}
                        </Text>
                        {cashDebts > 0 && (
                          <Text fontSize="xs" color="orange.600">
                            Debts: {formatCurrency(cashDebts, 'GHS')}
                          </Text>
                        )}
                        {eligibleForAutoApprove && (
                          <Badge colorScheme="green" size="xs" mt={1}>
                            Auto-Approve Eligible
                          </Badge>
                        )}
                      </Box>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={getStatusColor(payout.status)}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {formatStatus(payout.status)}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Tooltip label="View details">
                          <IconButton
                            icon={<ViewIcon />}
                            aria-label="View details"
                            size="sm"
                            variant="ghost"
                            onClick={() => loadPayoutDetails(payout.id)}
                          />
                        </Tooltip>
                        
                        {statusOptions.length > 0 && (
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<EditIcon />}
                              aria-label="Change status"
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              isLoading={processingAction === payout.id}
                            />
                            <MenuList>
                              {statusOptions.map(option => (
                                <MenuItem
                                  key={option.value}
                                  onClick={() => updatePayoutStatus(payout.id, option.value)}
                                  color={option.color + '.600'}
                                  icon={<option.icon />}
                                >
                                  {option.label}
                                </MenuItem>
                              ))}
                            </MenuList>
                          </Menu>
                        )}
                        
                        {payout.gateway_reference && (
                          <Tooltip label="View Paystack details">
                            <IconButton
                              icon={<ExternalLinkIcon />}
                              aria-label="Paystack details"
                              size="sm"
                              variant="ghost"
                              colorScheme="purple"
                              onClick={() => window.open(`https://dashboard.paystack.com/#/transactions/${payout.gateway_reference}`, '_blank')}
                            />
                          </Tooltip>
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
      
      {/* Payout Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Payout Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {payoutDetails ? (
              <VStack spacing={6} align="stretch">
                {/* Header Info */}
                <Box>
                  <Heading size="md" mb={2}>
                    Payout #{payoutDetails.id}
                  </Heading>
                  <Text color="gray.600">
                    Created: {formatDate(payoutDetails.created_at, 'medium')}
                  </Text>
                </Box>
                
                {/* Validation Status */}
                {payoutDetails.validation && (
                  <Box p={4} borderRadius="lg" bg={payoutDetails.validation.isValid ? 'green.50' : 'red.50'}>
                    <Flex align="center" gap={2} mb={2}>
                      {payoutDetails.validation.isValid ? (
                        <CheckCircleIcon color="green.500" />
                      ) : (
                        <WarningIcon color="red.500" />
                      )}
                      <Text fontWeight="bold">
                        {payoutDetails.validation.isValid ? 'Validation Passed' : 'Validation Failed'}
                      </Text>
                    </Flex>
                    
                    {payoutDetails.validation.errors.length > 0 && (
                      <Box mb={3}>
                        <Text fontWeight="medium" mb={1}>Errors:</Text>
                        {payoutDetails.validation.errors.map((error, index) => (
                          <Text key={index} fontSize="sm" color="red.600">• {error}</Text>
                        ))}
                      </Box>
                    )}
                    
                    {payoutDetails.validation.warnings.length > 0 && (
                      <Box>
                        <Text fontWeight="medium" mb={1}>Warnings:</Text>
                        {payoutDetails.validation.warnings.map((warning, index) => (
                          <Text key={index} fontSize="sm" color="orange.600">• {warning}</Text>
                        ))}
                      </Box>
                    )}
                    
                    <Text fontSize="sm" mt={2}>
                      Driver Balance: {formatCurrency(payoutDetails.validation.driverBalance || 0, 'GHS')} • 
                      Cash Debts: {formatCurrency(payoutDetails.validation.cashRideDebts || 0, 'GHS')} • 
                      Max Withdrawable: {formatCurrency(payoutDetails.validation.maxWithdrawable || 0, 'GHS')}
                    </Text>
                  </Box>
                )}
                
                {/* Status Section */}
                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold">Status</Text>
                      <Badge 
                        colorScheme={getStatusColor(payoutDetails.status)}
                        fontSize="md"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {formatStatus(payoutDetails.status)}
                      </Badge>
                    </Box>
                    {getStatusOptions(payoutDetails.status).length > 0 && (
                      <Menu>
                        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="blue">
                          Change Status
                        </MenuButton>
                        <MenuList>
                          {getStatusOptions(payoutDetails.status).map(option => (
                            <MenuItem
                              key={option.value}
                              onClick={() => updatePayoutStatus(payoutDetails.id, option.value)}
                              color={option.color + '.600'}
                              icon={<option.icon />}
                            >
                              {option.label}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Menu>
                    )}
                  </Flex>
                </Box>
                
                {/* Amount Details */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Amount Details</Text>
                    <Text><strong>Requested:</strong> {formatCurrency(payoutDetails.requested_amount, 'GHS')}</Text>
                    <Text><strong>Processing Fee ({withdrawalRules.processingFee}%):</strong> {formatCurrency(payoutDetails.processing_fee, 'GHS')}</Text>
                    <Text><strong>Net Amount:</strong> {formatCurrency(payoutDetails.net_amount, 'GHS')}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Driver Information</Text>
                    <Text><strong>Name:</strong> {payoutDetails.driver?.full_name}</Text>
                    <Text><strong>Email:</strong> {payoutDetails.driver?.email}</Text>
                    <Text><strong>Phone:</strong> {payoutDetails.driver?.phone}</Text>
                    <Text><strong>Account Status:</strong> 
                      <Badge colorScheme={payoutDetails.driver?.account_status === 'approved' ? 'green' : 'red'} ml={2}>
                        {payoutDetails.driver?.account_status || 'Unknown'}
                      </Badge>
                    </Text>
                  </Box>
                </SimpleGrid>
                
                {/* Driver Wallet Info */}
                {payoutDetails.driver_wallet && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Driver Wallet Status</Text>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text><strong>Available Balance:</strong> {formatCurrency(payoutDetails.driver_wallet.available_balance, 'GHS')}</Text>
                        <Text><strong>Total Earnings:</strong> {formatCurrency(payoutDetails.driver_wallet.total_earnings, 'GHS')}</Text>
                      </Box>
                      <Box>
                        <Text><strong>Cash Ride Debts:</strong> {formatCurrency(payoutDetails.driver_wallet.cash_ride_debts, 'GHS')}</Text>
                        <Text><strong>Total Withdrawn:</strong> {formatCurrency(payoutDetails.driver_wallet.total_withdrawn, 'GHS')}</Text>
                      </Box>
                    </SimpleGrid>
                    
                    {/* Minimum balance warning */}
                    {payoutDetails.driver_wallet.available_balance < withdrawalRules.minBalanceToKeep && (
                      <Alert status="warning" mt={2} borderRadius="md">
                        <AlertIcon />
                        Driver balance below minimum required ({formatCurrency(withdrawalRules.minBalanceToKeep, 'GHS')})
                      </Alert>
                    )}
                    
                    {/* Cash ride debts warning */}
                    {payoutDetails.driver_wallet.cash_ride_debts > 0 && (
                      <Alert status="info" mt={2} borderRadius="md">
                        <AlertIcon />
                        Driver has {formatCurrency(payoutDetails.driver_wallet.cash_ride_debts, 'GHS')} in cash ride commissions due
                      </Alert>
                    )}
                  </Box>
                )}
                
                {/* Payout Method */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Payout Method</Text>
                  {payoutDetails.payout_method ? (
                    <Box p={3} bg="gray.50" borderRadius="md">
                      <Text><strong>Type:</strong> {payoutDetails.payout_method.method_type === PAYOUT_METHODS.BANK_ACCOUNT ? 'Bank Account' : 'Mobile Money'}</Text>
                      <Text><strong>Provider:</strong> {payoutDetails.payout_method.provider}</Text>
                      <Text><strong>Account Name:</strong> {payoutDetails.payout_method.account_name}</Text>
                      <Text><strong>Account Number:</strong> {payoutDetails.payout_method.account_number}</Text>
                      {payoutDetails.payout_method.bank_name && (
                        <Text><strong>Bank Name:</strong> {payoutDetails.payout_method.bank_name}</Text>
                      )}
                      <Text><strong>Verification:</strong> 
                        <Badge colorScheme={payoutDetails.payout_method.verification_status === 'verified' ? 'green' : 'red'} ml={2}>
                          {payoutDetails.payout_method.verification_status || 'Not verified'}
                        </Badge>
                      </Text>
                    </Box>
                  ) : (
                    <Text color="gray.500">No payout method details available</Text>
                  )}
                </Box>
                
                {/* Gateway Information */}
                {payoutDetails.gateway_reference && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Paystack Gateway</Text>
                    <Box p={3} bg="purple.50" borderRadius="md">
                      <Text><strong>Reference:</strong> {payoutDetails.gateway_reference}</Text>
                      <Text><strong>Status:</strong> {payoutDetails.gateway_status || 'Unknown'}</Text>
                      <Text><strong>Processed At:</strong> {payoutDetails.processed_at ? formatDate(payoutDetails.processed_at) : 'Not processed'}</Text>
                      {payoutDetails.admin_processed_by && (
                        <Text><strong>Processed By:</strong> {payoutDetails.admin_processed_by.full_name}</Text>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Notes */}
                {(payoutDetails.admin_notes || payoutDetails.notes) && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Notes</Text>
                    <Box p={3} bg="yellow.50" borderRadius="md">
                      {payoutDetails.admin_notes && (
                        <Text><strong>Admin Notes:</strong> {payoutDetails.admin_notes}</Text>
                      )}
                      {payoutDetails.notes && (
                        <Text><strong>Driver Notes:</strong> {payoutDetails.notes}</Text>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Wallet Transaction */}
                {payoutDetails.wallet_transaction && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Wallet Transaction</Text>
                    <Box p={3} bg="blue.50" borderRadius="md">
                      <Text><strong>Transaction ID:</strong> {payoutDetails.wallet_transaction.id}</Text>
                      <Text><strong>Amount:</strong> {formatCurrency(payoutDetails.wallet_transaction.amount, 'GHS')}</Text>
                      <Text><strong>Balance Before:</strong> {formatCurrency(payoutDetails.wallet_transaction.balance_before, 'GHS')}</Text>
                      <Text><strong>Balance After:</strong> {formatCurrency(payoutDetails.wallet_transaction.balance_after, 'GHS')}</Text>
                    </Box>
                  </Box>
                )}
              </VStack>
            ) : (
              <Spinner />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDetailsClose}>
              Close
            </Button>
            {payoutDetails && getStatusOptions(payoutDetails.status).length > 0 && (
              <Menu>
                <MenuButton as={Button} colorScheme="blue" rightIcon={<ChevronDownIcon />}>
                  Take Action
                </MenuButton>
                <MenuList>
                  {getStatusOptions(payoutDetails.status).map(option => (
                    <MenuItem
                      key={option.value}
                      onClick={() => updatePayoutStatus(payoutDetails.id, option.value)}
                      color={option.color + '.600'}
                      icon={<option.icon />}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Validation Modal */}
      <Modal isOpen={isValidationOpen} onClose={onValidationClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Validation Failed</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPayout?.validation && (
              <VStack spacing={4} align="stretch">
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  Cannot approve payout due to validation errors
                </Alert>
                
                <Text fontWeight="bold">Validation Errors:</Text>
                {selectedPayout.validation.errors.map((error, index) => (
                  <Text key={index} color="red.600">• {error}</Text>
                ))}
                
                {selectedPayout.validation.warnings.length > 0 && (
                  <>
                    <Text fontWeight="bold" mt={2}>Warnings:</Text>
                    {selectedPayout.validation.warnings.map((warning, index) => (
                      <Text key={index} color="orange.600">• {warning}</Text>
                    ))}
                  </>
                )}
                
                <Box bg="gray.50" p={3} borderRadius="md">
                  <Text fontSize="sm"><strong>Driver:</strong> {selectedPayout.driver?.full_name}</Text>
                  <Text fontSize="sm"><strong>Requested:</strong> {formatCurrency(selectedPayout.requested_amount, 'GHS')}</Text>
                  <Text fontSize="sm"><strong>Driver Balance:</strong> {formatCurrency(selectedPayout.validation.driverBalance || 0, 'GHS')}</Text>
                  <Text fontSize="sm"><strong>Max Withdrawable:</strong> {formatCurrency(selectedPayout.validation.maxWithdrawable || 0, 'GHS')}</Text>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onValidationClose}>
              Close
            </Button>
            <Button colorScheme="red" onClick={() => {
              updatePayoutStatus(selectedPayout.id, PAYOUT_STATUS.CANCELLED, 'Cancelled due to validation errors');
              onValidationClose();
            }}>
              Cancel Payout
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Bulk Action Modal */}
      <Modal isOpen={isBulkOpen} onClose={onBulkClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bulk Action</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Apply action to {bulkAction.length} selected payout(s)
              </Text>
              
              <FormControl>
                <FormLabel>Action</FormLabel>
                <Select defaultValue={PAYOUT_STATUS.APPROVED}>
                  <option value={PAYOUT_STATUS.APPROVED}>Approve</option>
                  <option value={PAYOUT_STATUS.CANCELLED}>Cancel</option>
                  <option value={PAYOUT_STATUS.PROCESSING}>Mark as Processing</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Admin Notes (Optional)</FormLabel>
                <Textarea
                  placeholder="Add notes for this bulk action..."
                  rows={3}
                />
              </FormControl>
              
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                This action will be applied to all selected payouts. This cannot be undone.
              </Alert>
              
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                Note: Approval will validate each payout against withdrawal rules before processing.
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBulkClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={() => {
                const action = document.querySelector('select').value;
                const notes = document.querySelector('textarea').value;
                bulkUpdatePayouts(bulkAction, action, notes);
              }}
              isLoading={processingAction === 'bulk'}
            >
              Apply to {bulkAction.length} Payouts
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Withdrawal Rules Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Withdrawal Rules & Limits</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                These rules control how drivers can withdraw their earnings. They help protect platform commissions and prevent fraud.
              </Alert>
              
              <FormControl>
                <FormLabel>Processing Fee Percentage</FormLabel>
                <NumberInput
                  value={withdrawalRules.processingFee}
                  onChange={(value) => setWithdrawalRules(prev => ({ ...prev, processingFee: value }))}
                  min={0}
                  max={20}
                  step={0.5}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Percentage deducted from payout amount as processing fee
                </Text>
              </FormControl>
              
              <FormControl>
                <FormLabel>Minimum Balance to Keep (GHS)</FormLabel>
                <NumberInput
                  value={withdrawalRules.minBalanceToKeep}
                  onChange={(value) => setWithdrawalRules(prev => ({ ...prev, minBalanceToKeep: value }))}
                  min={0}
                  max={1000}
                  step={10}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Drivers must keep this minimum amount in their wallet for cash ride commissions and platform fees
                </Text>
              </FormControl>
              
              <FormControl>
                <FormLabel>Maximum Withdrawal Per Request (GHS)</FormLabel>
                <NumberInput
                  value={withdrawalRules.maxWithdrawalPerRequest}
                  onChange={(value) => setWithdrawalRules(prev => ({ ...prev, maxWithdrawalPerRequest: value }))}
                  min={0}
                  max={50000}
                  step={100}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Maximum amount a driver can withdraw in a single request
                </Text>
              </FormControl>
              
              <FormControl>
                <FormLabel>Maximum Withdrawals Per Day</FormLabel>
                <NumberInput
                  value={withdrawalRules.maxWithdrawalsPerDay}
                  onChange={(value) => setWithdrawalRules(prev => ({ ...prev, maxWithdrawalsPerDay: value }))}
                  min={1}
                  max={10}
                  step={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Maximum number of withdrawals a driver can make per day
                </Text>
              </FormControl>
              
              <FormControl>
                <Flex align="center" justify="space-between">
                  <Box>
                    <FormLabel mb={0}>Require Verified Payout Method</FormLabel>
                    <Text fontSize="sm" color="gray.600">
                      Drivers must have verified bank/mobile money accounts
                    </Text>
                  </Box>
                  <Switch
                    isChecked={withdrawalRules.requireVerification}
                    onChange={(e) => setWithdrawalRules(prev => ({ ...prev, requireVerification: e.target.checked }))}
                    colorScheme="blue"
                  />
                </Flex>
              </FormControl>
              
              <FormControl>
                <Flex align="center" justify="space-between">
                  <Box>
                    <FormLabel mb={0}>Enable Auto-Approval</FormLabel>
                    <Text fontSize="sm" color="gray.600">
                      Automatically approve payouts below threshold
                    </Text>
                  </Box>
                  <Switch
                    isChecked={withdrawalRules.autoApproveEnabled}
                    onChange={(e) => setWithdrawalRules(prev => ({ ...prev, autoApproveEnabled: e.target.checked }))}
                    colorScheme="green"
                  />
                </Flex>
              </FormControl>
              
              {withdrawalRules.autoApproveEnabled && (
                <FormControl>
                  <FormLabel>Auto-Approval Threshold (GHS)</FormLabel>
                  <NumberInput
                    value={withdrawalRules.autoApproveThreshold}
                    onChange={(value) => setWithdrawalRules(prev => ({ ...prev, autoApproveThreshold: value }))}
                    min={0}
                    max={10000}
                    step={100}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="sm" color="gray.600" mt={2}>
                    Payouts below this amount will be automatically approved (if all other rules pass)
                  </Text>
                </FormControl>
              )}
              
              <Box p={4} bg="blue.50" borderRadius="md">
                <Text fontWeight="bold" mb={2}>Current Rules Summary</Text>
                <Text fontSize="sm">• Processing Fee: {withdrawalRules.processingFee}%</Text>
                <Text fontSize="sm">• Minimum Balance: ₵{withdrawalRules.minBalanceToKeep}</Text>
                <Text fontSize="sm">• Max Per Withdrawal: ₵{withdrawalRules.maxWithdrawalPerRequest}</Text>
                <Text fontSize="sm">• Max Per Day: {withdrawalRules.maxWithdrawalsPerDay} withdrawals</Text>
                <Text fontSize="sm">• Verified Method Required: {withdrawalRules.requireVerification ? 'Yes' : 'No'}</Text>
                <Text fontSize="sm">• Auto-Approval: {withdrawalRules.autoApproveEnabled ? `Enabled (Below ₵${withdrawalRules.autoApproveThreshold})` : 'Disabled'}</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSettingsClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={saveWithdrawalRules}>
              Save Rules
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Payouts;