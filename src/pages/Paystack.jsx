// admin-panel/src/pages/Paystack.jsx
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
  Radio,
  RadioGroup,
  Stack,
  Container,
  Wrap,
  WrapItem,
  Textarea,
  Code,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
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
  DownloadIcon,
  ExternalLinkIcon,
  WarningTwoIcon,
  CheckIcon,
  TimeIcon,
  CopyIcon,
  InfoIcon,
  EditIcon,
} from '@chakra-ui/icons';
import { FiFilter, FiRefreshCw, FiAlertTriangle, FiDatabase, FiServer } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Constants
const ITEMS_PER_PAGE = 15;
const PAYSTACK_EVENTS = {
  CHARGE_SUCCESS: 'charge.success',
  CHARGE_FAILED: 'charge.failed',
  TRANSFER_SUCCESS: 'transfer.success',
  TRANSFER_FAILED: 'transfer.failed',
  TRANSFER_REVERSED: 'transfer.reversed',
  WEBHOOK_TEST: 'test.webhook',
};

const TRANSACTION_TYPES = {
  FUNDING: 'funding',
  PAYOUT: 'payout',
  REFUND: 'refund',
  VERIFICATION: 'verification',
};

const RECONCILIATION_STATUS = {
  MATCHED: 'matched',
  UNMATCHED: 'unmatched',
  PENDING: 'pending',
  DISCREPANCY: 'discrepancy',
  MANUAL_REVIEW: 'manual_review',
};

const Paystack = () => {
  const [transactions, setTransactions] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    eventType: 'all',
    transactionType: 'all',
    reconciliationStatus: 'all',
    startDate: null,
    endDate: null,
    minAmount: '',
    maxAmount: '',
    hasDiscrepancy: 'all',
  });
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    matchedTransactions: 0,
    unmatchedTransactions: 0,
    discrepancyCount: 0,
    webhookCount: 0,
    webhookSuccess: 0,
    webhookFailed: 0,
    totalWebhooks: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTab, setSelectedTab] = useState('transactions');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [reconciliationLog, setReconciliationLog] = useState([]);
  const [verifyingTransaction, setVerifyingTransaction] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  
  const toast = useToast();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isReconcileOpen, onOpen: onReconcileOpen, onClose: onReconcileClose } = useDisclosure();
  const { isOpen: isSyncOpen, onOpen: onSyncOpen, onClose: onSyncClose } = useDisclosure();
  const { isOpen: isWebhookOpen, onOpen: onWebhookOpen, onClose: onWebhookClose } = useDisclosure();
  
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
          second: '2-digit',
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
          second: '2-digit',
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
      case 'success':
      case 'completed':
      case 'matched':
      case 'verified':
        return 'green';
      case 'pending':
      case 'processing':
        return 'yellow';
      case 'failed':
      case 'unmatched':
      case 'discrepancy':
        return 'red';
      case 'manual_review':
        return 'orange';
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
      case 'success': return 'Success';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      case 'processing': return 'Processing';
      case 'matched': return 'Matched';
      case 'unmatched': return 'Unmatched';
      case 'discrepancy': return 'Discrepancy';
      case 'manual_review': return 'Manual Review';
      case 'reversed': return 'Reversed';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }, []);

  // Format Paystack event for display
  const formatEventType = useCallback((event) => {
    if (!event) return 'Unknown Event';
    
    const eventMap = {
      [PAYSTACK_EVENTS.CHARGE_SUCCESS]: 'Charge Success',
      [PAYSTACK_EVENTS.CHARGE_FAILED]: 'Charge Failed',
      [PAYSTACK_EVENTS.TRANSFER_SUCCESS]: 'Transfer Success',
      [PAYSTACK_EVENTS.TRANSFER_FAILED]: 'Transfer Failed',
      [PAYSTACK_EVENTS.TRANSFER_REVERSED]: 'Transfer Reversed',
      [PAYSTACK_EVENTS.WEBHOOK_TEST]: 'Webhook Test',
    };
    
    return eventMap[event] || event.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }, []);

  // Fetch Paystack transactions and webhooks - FIXED VERSION
  const fetchPaystackData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch Paystack transactions WITHOUT problematic joins
      const { data: transactionsData, error: txError, count: txCount } = await supabase
        .from('paystack_transactions')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            email,
            role
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      
      if (txError) {
        throw new Error(`Transactions error: ${txError.message}`);
      }
      
      // Fetch webhook logs
      const { data: webhooksData, error: webhookError } = await supabase
        .from('paystack_webhook_logs')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50);
      
      if (webhookError) {
        console.error('Webhook error:', webhookError);
        // Don't throw, just log
      }
      
      // Get related data for each transaction separately to avoid join issues
      const enhancedTransactions = await Promise.all(
        (transactionsData || []).map(async (tx) => {
          let payoutData = null;
          let walletTransactionData = null;
          
          try {
            // Get payout data separately
            const { data: payout } = await supabase
              .from('payouts')
              .select('id, driver_id, requested_amount, net_amount, status')
              .eq('paystack_transaction_id', tx.id)
              .single();
            
            if (payout) {
              payoutData = payout;
            }
          } catch (error) {
            // No payout found, that's okay
          }
          
          try {
            // Get wallet transaction data separately
            const { data: walletTx } = await supabase
              .from('wallet_transactions')
              .select('id, amount, transaction_type, balance_before, balance_after, status')
              .eq('external_reference', tx.paystack_reference)
              .single();
            
            if (walletTx) {
              walletTransactionData = walletTx;
            }
          } catch (error) {
            // No wallet transaction found, that's okay
          }
          
          return {
            ...tx,
            payout: payoutData,
            wallet_transaction: walletTransactionData
          };
        })
      );
      
      setTransactions(enhancedTransactions);
      setWebhooks(webhooksData || []);
      
      // Calculate comprehensive stats
      const stats = {
        totalTransactions: txCount || 0,
        totalAmount: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        matchedTransactions: 0,
        unmatchedTransactions: 0,
        discrepancyCount: 0,
        webhookCount: webhooksData?.length || 0,
        webhookSuccess: 0,
        webhookFailed: 0,
        totalWebhooks: webhooksData?.length || 0,
      };
      
      enhancedTransactions?.forEach(tx => {
        const amount = parseFloat(tx.amount) || 0;
        stats.totalAmount += amount;
        
        // Count by status
        if (tx.paystack_status === 'success') {
          stats.successfulTransactions++;
        } else if (tx.paystack_status === 'failed') {
          stats.failedTransactions++;
        }
        
        // Count reconciliation status
        if (tx.reconciliation_status === RECONCILIATION_STATUS.MATCHED) {
          stats.matchedTransactions++;
        } else if (tx.reconciliation_status === RECONCILIATION_STATUS.UNMATCHED) {
          stats.unmatchedTransactions++;
        } else if (tx.reconciliation_status === RECONCILIATION_STATUS.DISCREPANCY) {
          stats.discrepancyCount++;
        }
      });
      
      // Calculate webhook stats
      webhooksData?.forEach(webhook => {
        if (webhook.processed_successfully) {
          stats.webhookSuccess++;
        } else {
          stats.webhookFailed++;
        }
      });
      
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching Paystack data:', error);
      setError(error.message || 'Failed to fetch Paystack data');
      
      toast({
        title: 'Failed to load Paystack data',
        description: error.message || 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load transaction details - FIXED VERSION
  const loadTransactionDetails = useCallback(async (transactionId) => {
    try {
      // First get the basic transaction data
      const { data: transaction, error: txError } = await supabase
        .from('paystack_transactions')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            email,
            phone,
            role,
            account_status
          )
        `)
        .eq('id', transactionId)
        .single();
      
      if (txError) throw txError;
      
      if (transaction) {
        // Get related data separately
        let payoutData = null;
        let walletTransactionData = null;
        let reconciliationLogsData = null;
        
        try {
          // Get payout data
          const { data: payout } = await supabase
            .from('payouts')
            .select('id, driver_id, requested_amount, net_amount, status, processing_fee, admin_notes, processed_at, processed_by')
            .eq('paystack_transaction_id', transactionId)
            .single();
          
          if (payout) {
            payoutData = payout;
          }
        } catch (error) {
          // No payout found, that's okay
        }
        
        try {
          // Get wallet transaction data
          const { data: walletTx } = await supabase
            .from('wallet_transactions')
            .select('id, transaction_type, source_type, amount, balance_before, balance_after, status, description, created_at, user_id, user_role')
            .eq('external_reference', transaction.paystack_reference)
            .single();
          
          if (walletTx) {
            walletTransactionData = walletTx;
          }
        } catch (error) {
          // No wallet transaction found, that's okay
        }
        
        try {
          // Get reconciliation logs
          const { data: logs } = await supabase
            .from('paystack_reconciliation_logs')
            .select('id, action, description, performed_by, performed_at, previous_status, new_status')
            .eq('transaction_id', transactionId)
            .order('performed_at', { ascending: false });
          
          if (logs) {
            reconciliationLogsData = logs;
          }
        } catch (error) {
          // No logs found, that's okay
        }
        
        // Combine all data
        const combinedData = {
          ...transaction,
          payout: payoutData,
          wallet_transaction: walletTransactionData,
          reconciliation_logs: reconciliationLogsData
        };
        
        setTransactionDetails(combinedData);
        setSelectedTransaction(combinedData);
        onDetailsOpen();
      }
      
    } catch (error) {
      console.error('Error loading transaction details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [onDetailsOpen, toast]);

  // Verify transaction with Paystack API
  const verifyWithPaystack = useCallback(async (transactionReference) => {
    try {
      setVerifyingTransaction(transactionReference);
      
      const response = await fetch(`/api/paystack/verify/${transactionReference}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Paystack verification failed');
      }
      
      const result = await response.json();
      
      // Update local record
      await supabase
        .from('paystack_transactions')
        .update({
          paystack_status: result.data.status,
          gateway_response: result,
          verified_at: new Date().toISOString(),
          internal_status: result.data.status === 'success' ? 'verified' : 'verification_failed',
          updated_at: new Date().toISOString(),
        })
        .eq('paystack_reference', transactionReference);
      
      toast({
        title: 'Verification Successful',
        description: `Transaction ${transactionReference} verified with Paystack`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh data
      await fetchPaystackData();
      
    } catch (error) {
      console.error('Error verifying with Paystack:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify with Paystack',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setVerifyingTransaction(null);
    }
  }, [fetchPaystackData, toast]);

  // Manually reconcile transaction
  const manuallyReconcile = useCallback(async (transactionId, action, notes = null) => {
    try {
      setProcessingAction(transactionId);
      
      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Admin authentication required');
      }
      
      // Update reconciliation status
      const { error } = await supabase
        .from('paystack_transactions')
        .update({
          reconciliation_status: action,
          reconciliation_notes: notes,
          reconciled_at: new Date().toISOString(),
          reconciled_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);
      
      if (error) throw error;
      
      // Log reconciliation action
      await supabase
        .from('paystack_reconciliation_logs')
        .insert({
          transaction_id: transactionId,
          action: 'manual_reconciliation',
          description: notes || `Manually marked as ${action}`,
          performed_by: user.id,
          performed_at: new Date().toISOString(),
          previous_status: transactionDetails?.reconciliation_status || 'pending',
          new_status: action,
        });
      
      toast({
        title: 'Reconciliation Updated',
        description: `Transaction marked as ${action}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh data
      await fetchPaystackData();
      onReconcileClose();
      
    } catch (error) {
      console.error('Error reconciling transaction:', error);
      toast({
        title: 'Reconciliation Failed',
        description: error.message || 'Failed to update reconciliation status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingAction(null);
    }
  }, [fetchPaystackData, onReconcileClose, toast, transactionDetails]);

  // Run automatic reconciliation
  const runReconciliation = useCallback(async () => {
    try {
      setSyncLoading(true);
      
      const response = await fetch('/api/paystack/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Reconciliation failed');
      }
      
      const result = await response.json();
      
      // Update reconciliation log
      setReconciliationLog(prev => [{
        timestamp: new Date().toISOString(),
        action: 'auto_reconciliation',
        details: result.message,
        stats: result.stats,
      }, ...prev]);
      
      toast({
        title: 'Reconciliation Complete',
        description: result.message || 'Automatic reconciliation completed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh data
      await fetchPaystackData();
      
    } catch (error) {
      console.error('Error running reconciliation:', error);
      toast({
        title: 'Reconciliation Failed',
        description: error.message || 'Failed to run reconciliation',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncLoading(false);
      onSyncClose();
    }
  }, [fetchPaystackData, onSyncClose, toast]);

  // Sync with Paystack API
  const syncWithPaystack = useCallback(async (days = 7) => {
    try {
      setSyncLoading(true);
      
      const response = await fetch('/api/paystack/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days: days,
          sync_type: 'all',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Sync failed');
      }
      
      const result = await response.json();
      
      // Update reconciliation log
      setReconciliationLog(prev => [{
        timestamp: new Date().toISOString(),
        action: 'api_sync',
        details: `Synced ${result.synced_count} transactions from Paystack`,
        stats: result,
      }, ...prev]);
      
      toast({
        title: 'Sync Complete',
        description: `Synced ${result.synced_count} transactions from Paystack`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh data
      await fetchPaystackData();
      
    } catch (error) {
      console.error('Error syncing with Paystack:', error);
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to sync with Paystack',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncLoading(false);
    }
  }, [fetchPaystackData, toast]);

  // Handle filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger filter recalculation
    }, 300);
    
    return () => clearTimeout(timer);
  }, [filters]);

  // Initial data fetch
  useEffect(() => {
    fetchPaystackData();
    
    // Set up real-time subscriptions
    const channel1 = supabase
      .channel('paystack_transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paystack_transactions'
        },
        () => {
          fetchPaystackData();
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel('paystack_webhook_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'paystack_webhook_logs'
        },
        () => {
          fetchPaystackData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [fetchPaystackData]);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    
    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      result = result.filter(tx => {
        return (
          tx.paystack_reference?.toLowerCase().includes(searchTerm) ||
          tx.id?.toString().includes(searchTerm) ||
          tx.user?.email?.toLowerCase().includes(searchTerm) ||
          tx.user?.full_name?.toLowerCase().includes(searchTerm) ||
          tx.payout?.id?.toString().includes(searchTerm) ||
          tx.wallet_transaction?.id?.toString().includes(searchTerm)
        );
      });
    }
    
    // Event type filter
    if (filters.eventType !== 'all') {
      result = result.filter(tx => tx.event_type === filters.eventType);
    }
    
    // Transaction type filter
    if (filters.transactionType !== 'all') {
      result = result.filter(tx => tx.transaction_type === filters.transactionType);
    }
    
    // Reconciliation status filter
    if (filters.reconciliationStatus !== 'all') {
      result = result.filter(tx => tx.reconciliation_status === filters.reconciliationStatus);
    }
    
    // Has discrepancy filter
    if (filters.hasDiscrepancy !== 'all') {
      const hasDiscrepancy = filters.hasDiscrepancy === 'yes';
      result = result.filter(tx => {
        const discrepancy = tx.amount_discrepancy || tx.status_discrepancy;
        return hasDiscrepancy ? discrepancy : !discrepancy;
      });
    }
    
    // Date filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate >= startDate;
      });
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(tx => {
        const txDate = new Date(tx.created_at);
        return txDate <= endDate;
      });
    }
    
    // Amount filters
    if (filters.minAmount) {
      const minAmount = parseFloat(filters.minAmount);
      if (!isNaN(minAmount)) {
        result = result.filter(tx => {
          const amount = parseFloat(tx.amount) || 0;
          return amount >= minAmount;
        });
      }
    }
    
    if (filters.maxAmount) {
      const maxAmount = parseFloat(filters.maxAmount);
      if (!isNaN(maxAmount)) {
        result = result.filter(tx => {
          const amount = parseFloat(tx.amount) || 0;
          return amount <= maxAmount;
        });
      }
    }
    
    return result;
  }, [transactions, filters]);

  // Export to CSV - FIXED: Now uses filteredTransactions which is properly declared
  const exportToCSV = useCallback((type = 'transactions') => {
    try {
      const data = type === 'transactions' ? filteredTransactions : webhooks;
      
      if (!data || data.length === 0) {
        toast({
          title: 'No data to export',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const headers = type === 'transactions' ? [
        'Transaction ID',
        'Date',
        'Paystack Reference',
        'Event Type',
        'Amount (GHS)',
        'Currency',
        'Paystack Status',
        'Internal Status',
        'Reconciliation Status',
        'User Email',
        'User Role',
        'Local Transaction ID',
        'Payout ID',
        'Created At',
        'Updated At',
      ] : [
        'Webhook ID',
        'Received At',
        'Event Type',
        'Paystack Reference',
        'Processed Successfully',
        'Processing Time (ms)',
        'Response Status',
        'Error Message',
        'Attempts',
        'Payload',
      ];
      
      const csvData = data.map(item => {
        if (type === 'transactions') {
          return [
            item.id,
            new Date(item.created_at).toISOString().split('T')[0],
            item.paystack_reference || '',
            item.event_type || '',
            item.amount || 0,
            item.currency || 'GHS',
            item.paystack_status || '',
            item.internal_status || '',
            item.reconciliation_status || '',
            item.user?.email || '',
            item.user?.role || '',
            item.wallet_transaction?.id || '',
            item.payout?.id || '',
            item.created_at,
            item.updated_at,
          ];
        } else {
          return [
            item.id,
            item.received_at,
            item.event_type,
            item.paystack_reference || '',
            item.processed_successfully ? 'Yes' : 'No',
            item.processing_time_ms || 0,
            item.response_status || '',
            item.error_message || '',
            item.attempts || 1,
            JSON.stringify(item.payload || {}),
          ];
        }
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
        `${type}_export_${new Date().toISOString().split('T')[0]}_${data.length}_records.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Export successful',
        description: `${data.length} records exported`,
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
  }, [filteredTransactions, webhooks, toast]);

  // Copy to clipboard
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }).catch(() => {
      toast({
        title: 'Copy failed',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    });
  }, [toast]);

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
      eventType: 'all',
      transactionType: 'all',
      reconciliationStatus: 'all',
      startDate: null,
      endDate: null,
      minAmount: '',
      maxAmount: '',
      hasDiscrepancy: 'all',
    });
    setCurrentPage(1);
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPaystackData();
    setIsRefreshing(false);
    
    toast({
      title: 'Data refreshed',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [fetchPaystackData, toast]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get reconciliation options
  const getReconciliationOptions = useCallback((currentStatus) => {
    const options = [
      { value: RECONCILIATION_STATUS.MATCHED, label: 'Mark as Matched', color: 'green' },
      { value: RECONCILIATION_STATUS.UNMATCHED, label: 'Mark as Unmatched', color: 'red' },
      { value: RECONCILIATION_STATUS.DISCREPANCY, label: 'Mark as Discrepancy', color: 'orange' },
      { value: RECONCILIATION_STATUS.MANUAL_REVIEW, label: 'Send for Review', color: 'yellow' },
    ];
    
    return options.filter(opt => opt.value !== currentStatus);
  }, []);

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
          <Heading size="lg" mb={2}>Paystack Reconciliation</Heading>
          <Text color="gray.600">
            {stats.totalTransactions} transactions • {stats.matchedTransactions} matched • 
            {stats.discrepancyCount} discrepancies • {stats.webhookCount} webhooks
          </Text>
        </Box>
        
        <Flex gap={3}>
          <Button
            leftIcon={<FiRefreshCw />}
            colorScheme="blue"
            onClick={() => onSyncOpen()}
            isLoading={syncLoading}
          >
            Run Reconciliation
          </Button>
          
          <Button
            leftIcon={<FiServer />}
            colorScheme="purple"
            onClick={() => syncWithPaystack(7)}
            isLoading={syncLoading}
          >
            Sync with Paystack
          </Button>
          
          <Tooltip label="Refresh data">
            <IconButton
              icon={<RepeatIcon />}
              aria-label="Refresh"
              onClick={refreshData}
              isLoading={isRefreshing}
            />
          </Tooltip>
          
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
              Export
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => exportToCSV('transactions')}>
                Export Transactions
              </MenuItem>
              <MenuItem onClick={() => exportToCSV('webhooks')}>
                Export Webhooks
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
      
      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6} borderRadius="lg">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Error loading Paystack data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
          <Button size="sm" onClick={fetchPaystackData}>
            Retry
          </Button>
        </Alert>
      )}
      
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Total Transactions</StatLabel>
            <StatNumber>{stats.totalTransactions}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {formatCurrency(stats.totalAmount, 'GHS')}
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Reconciliation Status</StatLabel>
            <StatNumber>{stats.matchedTransactions}</StatNumber>
            <StatHelpText>
              Matched • {stats.unmatchedTransactions} Unmatched
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Webhook Processing</StatLabel>
            <StatNumber color="green.600">{stats.webhookSuccess}</StatNumber>
            <StatHelpText>
              Success • <Text as="span" color="red.600">{stats.webhookFailed} Failed</Text>
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box bg="white" p={4} borderRadius="lg" shadow="sm">
          <Stat>
            <StatLabel>Discrepancies</StatLabel>
            <StatNumber color="orange.600">{stats.discrepancyCount}</StatNumber>
            <StatHelpText>
              {stats.failedTransactions} failed transactions
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>
      
      {/* Main Tabs */}
      <Box bg="white" borderRadius="lg" shadow="sm" mb={6}>
        <Tabs 
          variant="enclosed" 
          colorScheme="blue"
          onChange={(index) => {
            const tabs = ['transactions', 'webhooks', 'logs'];
            setSelectedTab(tabs[index]);
            setCurrentPage(1);
          }}
        >
          <TabList>
            <Tab>
              <Flex align="center" gap={2}>
                <FiDatabase />
                <Text>Transactions ({stats.totalTransactions})</Text>
              </Flex>
            </Tab>
            <Tab>
              <Flex align="center" gap={2}>
                <FiServer />
                <Text>Webhooks ({stats.webhookCount})</Text>
              </Flex>
            </Tab>
            <Tab>
              <Flex align="center" gap={2}>
                <FiAlertTriangle />
                <Text>Reconciliation Logs</Text>
              </Flex>
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Transactions Panel */}
            <TabPanel>
              {/* Filters */}
              <Box bg="gray.50" p={4} borderRadius="lg" mb={6}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontWeight="medium">Filters</Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<CloseIcon />}
                    onClick={clearFilters}
                  >
                    Clear All
                  </Button>
                </Flex>
                
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} width="100%">
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search by reference, email, or ID..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      width="100%"
                    />
                  </InputGroup>
                  
                  <Select
                    value={filters.eventType}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
                    width="100%"
                  >
                    <option value="all">All Event Types</option>
                    <option value={PAYSTACK_EVENTS.CHARGE_SUCCESS}>Charge Success</option>
                    <option value={PAYSTACK_EVENTS.CHARGE_FAILED}>Charge Failed</option>
                    <option value={PAYSTACK_EVENTS.TRANSFER_SUCCESS}>Transfer Success</option>
                    <option value={PAYSTACK_EVENTS.TRANSFER_FAILED}>Transfer Failed</option>
                    <option value={PAYSTACK_EVENTS.TRANSFER_REVERSED}>Transfer Reversed</option>
                  </Select>
                  
                  <Select
                    value={filters.reconciliationStatus}
                    onChange={(e) => handleFilterChange('reconciliationStatus', e.target.value)}
                    width="100%"
                  >
                    <option value="all">All Reconciliation Status</option>
                    <option value={RECONCILIATION_STATUS.MATCHED}>Matched</option>
                    <option value={RECONCILIATION_STATUS.UNMATCHED}>Unmatched</option>
                    <option value={RECONCILIATION_STATUS.DISCREPANCY}>Discrepancy</option>
                    <option value={RECONCILIATION_STATUS.MANUAL_REVIEW}>Manual Review</option>
                    <option value={RECONCILIATION_STATUS.PENDING}>Pending</option>
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
                  
                  <Select
                    value={filters.transactionType}
                    onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                    width="100%"
                  >
                    <option value="all">All Transaction Types</option>
                    <option value={TRANSACTION_TYPES.FUNDING}>Funding</option>
                    <option value={TRANSACTION_TYPES.PAYOUT}>Payout</option>
                    <option value={TRANSACTION_TYPES.REFUND}>Refund</option>
                    <option value={TRANSACTION_TYPES.VERIFICATION}>Verification</option>
                  </Select>
                  
                  <Select
                    value={filters.hasDiscrepancy}
                    onChange={(e) => handleFilterChange('hasDiscrepancy', e.target.value)}
                    width="100%"
                  >
                    <option value="all">All Transactions</option>
                    <option value="yes">With Discrepancies</option>
                    <option value="no">Without Discrepancies</option>
                  </Select>
                </SimpleGrid>
              </Box>
              
              {/* Results Summary */}
              <Flex justify="space-between" align="center" mb={4} width="100%">
                <Text color="gray.600">
                  Showing {Math.min(paginatedTransactions.length, ITEMS_PER_PAGE)} of {filteredTransactions.length} transactions
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
              
              {/* Transactions Table */}
              <Box bg="white" borderRadius="lg" shadow="sm" overflow="auto" mb={6} width="100%">
                <Table variant="simple" size="md">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Date</Th>
                      <Th>Reference</Th>
                      <Th>Event Type</Th>
                      <Th isNumeric>Amount</Th>
                      <Th>Paystack Status</Th>
                      <Th>Reconciliation</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {paginatedTransactions.length === 0 ? (
                      <Tr>
                        <Td colSpan={7} textAlign="center" py={10}>
                          <Box>
                            <Text mb={2}>No transactions found</Text>
                            <Text fontSize="sm" color="gray.600">
                              Try adjusting your filters or search terms
                            </Text>
                          </Box>
                        </Td>
                      </Tr>
                    ) : (
                      paginatedTransactions.map((tx) => {
                        const hasDiscrepancy = tx.amount_discrepancy || tx.status_discrepancy;
                        const reconciliationOptions = getReconciliationOptions(tx.reconciliation_status);
                        
                        return (
                          <Tr key={tx.id} _hover={{ bg: 'gray.50' }}>
                            <Td>
                              <Text fontSize="sm">
                                {formatDate(tx.created_at, 'short')}
                              </Text>
                            </Td>
                            <Td>
                              <Tooltip label={tx.paystack_reference || 'No reference'}>
                                <Text 
                                  fontSize="sm" 
                                  fontFamily="mono" 
                                  isTruncated 
                                  maxW="150px"
                                >
                                  {tx.paystack_reference || '—'}
                                </Text>
                              </Tooltip>
                            </Td>
                            <Td>
                              <Text fontSize="sm">{formatEventType(tx.event_type)}</Text>
                              <Text fontSize="xs" color="gray.600">
                                {tx.transaction_type || 'N/A'}
                              </Text>
                            </Td>
                            <Td isNumeric fontWeight="bold" fontSize="sm">
                              {formatCurrency(tx.amount, tx.currency || 'GHS')}
                              {hasDiscrepancy && (
                                <Text fontSize="xs" color="red.600">
                                  Discrepancy detected
                                </Text>
                              )}
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={getStatusColor(tx.paystack_status)}
                                fontSize="xs"
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {formatStatus(tx.paystack_status)}
                              </Badge>
                            </Td>
                            <Td>
                              <Flex align="center" gap={2}>
                                <Badge 
                                  colorScheme={getStatusColor(tx.reconciliation_status)}
                                  fontSize="xs"
                                  px={2}
                                  py={1}
                                  borderRadius="full"
                                >
                                  {formatStatus(tx.reconciliation_status)}
                                </Badge>
                                {hasDiscrepancy && (
                                  <WarningTwoIcon color="orange.500" />
                                )}
                              </Flex>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  icon={<ViewIcon />}
                                  aria-label="View details"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => loadTransactionDetails(tx.id)}
                                />
                                
                                {tx.paystack_reference && (
                                  <Tooltip label="Verify with Paystack">
                                    <IconButton
                                      icon={<CheckCircleIcon />}
                                      aria-label="Verify"
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="green"
                                      onClick={() => verifyWithPaystack(tx.paystack_reference)}
                                      isLoading={verifyingTransaction === tx.paystack_reference}
                                    />
                                  </Tooltip>
                                )}
                                
                                {reconciliationOptions.length > 0 && (
                                  <Menu>
                                    <MenuButton
                                      as={IconButton}
                                      icon={<EditIcon />}
                                      aria-label="Reconcile"
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="blue"
                                      isLoading={processingAction === tx.id}
                                    />
                                    <MenuList>
                                      {reconciliationOptions.map(option => (
                                        <MenuItem
                                          key={option.value}
                                          onClick={() => manuallyReconcile(tx.id, option.value)}
                                          color={option.color + '.600'}
                                        >
                                          {option.label}
                                        </MenuItem>
                                      ))}
                                    </MenuList>
                                  </Menu>
                                )}
                                
                                {tx.paystack_reference && (
                                  <Tooltip label="Open in Paystack Dashboard">
                                    <IconButton
                                      icon={<ExternalLinkIcon />}
                                      aria-label="Paystack Dashboard"
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="purple"
                                      onClick={() => window.open(`https://dashboard.paystack.com/#/transactions/${tx.paystack_reference}`, '_blank')}
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
            </TabPanel>
            
            {/* Webhooks Panel */}
            <TabPanel>
              <Box bg="white" borderRadius="lg" shadow="sm" overflow="auto" mb={6} width="100%">
                <Table variant="simple" size="md">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Received At</Th>
                      <Th>Event Type</Th>
                      <Th>Reference</Th>
                      <Th>Status</Th>
                      <Th>Processing Time</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {webhooks.length === 0 ? (
                      <Tr>
                        <Td colSpan={6} textAlign="center" py={10}>
                          <Box>
                            <Text mb={2}>No webhooks found</Text>
                            <Text fontSize="sm" color="gray.600">
                              Webhook logs will appear here when received
                            </Text>
                          </Box>
                        </Td>
                      </Tr>
                    ) : (
                      webhooks.map((webhook) => (
                        <Tr key={webhook.id} _hover={{ bg: 'gray.50' }}>
                          <Td>
                            <Text fontSize="sm">
                              {formatDate(webhook.received_at, 'short')}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">{formatEventType(webhook.event_type)}</Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontFamily="mono">
                              {webhook.paystack_reference || '—'}
                            </Text>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={webhook.processed_successfully ? 'green' : 'red'}
                              fontSize="xs"
                              px={2}
                              py={1}
                              borderRadius="full"
                            >
                              {webhook.processed_successfully ? 'Processed' : 'Failed'}
                            </Badge>
                            {webhook.attempts > 1 && (
                              <Text fontSize="xs" color="gray.600">
                                {webhook.attempts} attempts
                              </Text>
                            )}
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {webhook.processing_time_ms || 0}ms
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              Status: {webhook.response_status || 'N/A'}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                icon={<ViewIcon />}
                                aria-label="View webhook"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTransaction(webhook);
                                  onWebhookOpen();
                                }}
                              />
                              <Tooltip label="Copy payload">
                                <IconButton
                                  icon={<CopyIcon />}
                                  aria-label="Copy payload"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(JSON.stringify(webhook.payload || {}, null, 2))}
                                />
                              </Tooltip>
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
            
            {/* Reconciliation Logs Panel */}
            <TabPanel>
              <Box bg="white" borderRadius="lg" shadow="sm" p={6} mb={6}>
                <Heading size="md" mb={4}>Reconciliation Activity Log</Heading>
                
                <Button
                  leftIcon={<RepeatIcon />}
                  colorScheme="blue"
                  onClick={runReconciliation}
                  isLoading={syncLoading}
                  mb={4}
                >
                  Run Automatic Reconciliation
                </Button>
                
                {reconciliationLog.length === 0 ? (
                  <Box textAlign="center" py={10}>
                    <Text mb={2}>No reconciliation logs yet</Text>
                    <Text fontSize="sm" color="gray.600">
                      Run reconciliation to see activity logs
                    </Text>
                  </Box>
                ) : (
                  <Accordion allowMultiple>
                    {reconciliationLog.map((log, index) => (
                      <AccordionItem key={index}>
                        <h2>
                          <AccordionButton>
                            <Box flex="1" textAlign="left">
                              <Flex align="center" gap={2}>
                                <Badge colorScheme="blue">{log.action.replace('_', ' ')}</Badge>
                                <Text fontSize="sm">{formatDate(log.timestamp, 'short')}</Text>
                              </Flex>
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>
                        </h2>
                        <AccordionPanel pb={4}>
                          <Text mb={2}>{log.details}</Text>
                          {log.stats && (
                            <Code display="block" whiteSpace="pre" p={2} borderRadius="md">
                              {JSON.stringify(log.stats, null, 2)}
                            </Code>
                          )}
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      
      {/* Transaction Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {transactionDetails ? (
              <VStack spacing={6} align="stretch">
                {/* Header Info */}
                <Box>
                  <Heading size="md" mb={2}>
                    Paystack Transaction #{transactionDetails.id}
                  </Heading>
                  <Text color="gray.600">
                    Reference: <Code>{transactionDetails.paystack_reference || 'No reference'}</Code>
                  </Text>
                </Box>
                
                {/* Status Section */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Paystack Status</Text>
                    <Badge 
                      colorScheme={getStatusColor(transactionDetails.paystack_status)}
                      fontSize="md"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {formatStatus(transactionDetails.paystack_status)}
                    </Badge>
                    <Text fontSize="sm" mt={1}>
                      Event: {formatEventType(transactionDetails.event_type)}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Reconciliation Status</Text>
                    <Badge 
                      colorScheme={getStatusColor(transactionDetails.reconciliation_status)}
                      fontSize="md"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {formatStatus(transactionDetails.reconciliation_status)}
                    </Badge>
                    {getReconciliationOptions(transactionDetails.reconciliation_status).length > 0 && (
                      <Menu>
                        <MenuButton as={Button} size="sm" mt={2} rightIcon={<ChevronDownIcon />}>
                          Update Status
                        </MenuButton>
                        <MenuList>
                          {getReconciliationOptions(transactionDetails.reconciliation_status).map(option => (
                            <MenuItem
                              key={option.value}
                              onClick={() => manuallyReconcile(transactionDetails.id, option.value)}
                              color={option.color + '.600'}
                            >
                              {option.label}
                            </MenuItem>
                          ))}
                        </MenuList>
                      </Menu>
                    )}
                  </Box>
                </SimpleGrid>
                
                {/* Amount Details */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Amount Details</Text>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text><strong>Amount:</strong> {formatCurrency(transactionDetails.amount, transactionDetails.currency)}</Text>
                      <Text><strong>Currency:</strong> {transactionDetails.currency || 'GHS'}</Text>
                      <Text><strong>Transaction Type:</strong> {transactionDetails.transaction_type}</Text>
                    </Box>
                    <Box>
                      <Text><strong>Created:</strong> {formatDate(transactionDetails.created_at, 'medium')}</Text>
                      <Text><strong>Updated:</strong> {formatDate(transactionDetails.updated_at, 'medium')}</Text>
                      {transactionDetails.verified_at && (
                        <Text><strong>Verified:</strong> {formatDate(transactionDetails.verified_at, 'medium')}</Text>
                      )}
                    </Box>
                  </SimpleGrid>
                </Box>
                
                {/* User Information */}
                {transactionDetails.user && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>User Information</Text>
                    <Box p={3} bg="blue.50" borderRadius="md">
                      <Text><strong>Name:</strong> {transactionDetails.user.full_name}</Text>
                      <Text><strong>Email:</strong> {transactionDetails.user.email}</Text>
                      <Text><strong>Role:</strong> {transactionDetails.user.role}</Text>
                      <Text><strong>Account Status:</strong> {transactionDetails.user.account_status}</Text>
                    </Box>
                  </Box>
                )}
                
                {/* Related Entities */}
                {(transactionDetails.wallet_transaction || transactionDetails.payout) && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Related Entities</Text>
                    
                    {transactionDetails.wallet_transaction && (
                      <Box mb={3} p={3} bg="green.50" borderRadius="md">
                        <Text fontWeight="medium">Wallet Transaction</Text>
                        <Text><strong>ID:</strong> {transactionDetails.wallet_transaction.id}</Text>
                        <Text><strong>Amount:</strong> {formatCurrency(transactionDetails.wallet_transaction.amount, 'GHS')}</Text>
                        <Text><strong>Type:</strong> {transactionDetails.wallet_transaction.transaction_type}</Text>
                        <Text><strong>Status:</strong> {transactionDetails.wallet_transaction.status}</Text>
                      </Box>
                    )}
                    
                    {transactionDetails.payout && (
                      <Box p={3} bg="purple.50" borderRadius="md">
                        <Text fontWeight="medium">Payout</Text>
                        <Text><strong>ID:</strong> {transactionDetails.payout.id}</Text>
                        <Text><strong>Requested Amount:</strong> {formatCurrency(transactionDetails.payout.requested_amount, 'GHS')}</Text>
                        <Text><strong>Net Amount:</strong> {formatCurrency(transactionDetails.payout.net_amount, 'GHS')}</Text>
                        <Text><strong>Status:</strong> {transactionDetails.payout.status}</Text>
                      </Box>
                    )}
                  </Box>
                )}
                
                {/* Discrepancies */}
                {(transactionDetails.amount_discrepancy || transactionDetails.status_discrepancy) && (
                  <Box>
                    <Text fontWeight="bold" mb={2} color="orange.600">
                      <WarningIcon mr={2} />
                      Discrepancies Detected
                    </Text>
                    <Box p={3} bg="orange.50" borderRadius="md">
                      {transactionDetails.amount_discrepancy && (
                        <Text><strong>Amount Discrepancy:</strong> {transactionDetails.amount_discrepancy}</Text>
                      )}
                      {transactionDetails.status_discrepancy && (
                        <Text><strong>Status Discrepancy:</strong> {transactionDetails.status_discrepancy}</Text>
                      )}
                      {transactionDetails.discrepancy_notes && (
                        <Text><strong>Notes:</strong> {transactionDetails.discrepancy_notes}</Text>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Gateway Response */}
                {transactionDetails.gateway_response && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Gateway Response</Text>
                    <Code display="block" whiteSpace="pre" p={2} borderRadius="md" maxH="200px" overflowY="auto">
                      {JSON.stringify(transactionDetails.gateway_response, null, 2)}
                    </Code>
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
            {transactionDetails?.paystack_reference && (
              <Button
                colorScheme="green"
                onClick={() => verifyWithPaystack(transactionDetails.paystack_reference)}
                isLoading={verifyingTransaction === transactionDetails.paystack_reference}
              >
                Verify with Paystack
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Webhook Details Modal */}
      <Modal isOpen={isWebhookOpen} onClose={onWebhookClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Webhook Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTransaction && (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>Webhook Information</Text>
                  <Text><strong>Received:</strong> {formatDate(selectedTransaction.received_at, 'medium')}</Text>
                  <Text><strong>Event Type:</strong> {formatEventType(selectedTransaction.event_type)}</Text>
                  <Text><strong>Reference:</strong> {selectedTransaction.paystack_reference || 'N/A'}</Text>
                  <Text><strong>Status:</strong> 
                    <Badge 
                      colorScheme={selectedTransaction.processed_successfully ? 'green' : 'red'}
                      ml={2}
                    >
                      {selectedTransaction.processed_successfully ? 'Processed Successfully' : 'Failed'}
                    </Badge>
                  </Text>
                  <Text><strong>Processing Time:</strong> {selectedTransaction.processing_time_ms || 0}ms</Text>
                  <Text><strong>Attempts:</strong> {selectedTransaction.attempts || 1}</Text>
                </Box>
                
                {selectedTransaction.error_message && (
                  <Box>
                    <Text fontWeight="bold" mb={2} color="red.600">Error Message</Text>
                    <Box p={3} bg="red.50" borderRadius="md">
                      <Text>{selectedTransaction.error_message}</Text>
                    </Box>
                  </Box>
                )}
                
                {selectedTransaction.payload && (
                  <Box>
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontWeight="bold">Payload</Text>
                      <Tooltip label="Copy payload">
                        <IconButton
                          icon={<CopyIcon />}
                          aria-label="Copy payload"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(selectedTransaction.payload, null, 2))}
                        />
                      </Tooltip>
                    </Flex>
                    <Code display="block" whiteSpace="pre" p={2} borderRadius="md" maxH="300px" overflowY="auto">
                      {JSON.stringify(selectedTransaction.payload, null, 2)}
                    </Code>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onWebhookClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Sync Modal */}
      <Modal isOpen={isSyncOpen} onClose={onSyncClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Run Reconciliation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                This will run automatic reconciliation between Paystack transactions and local records.
              </Text>
              
              <FormControl>
                <FormLabel>Sync Days</FormLabel>
                <NumberInput defaultValue={7} min={1} max={30}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Text fontSize="sm" color="gray.600" mt={2}>
                  Number of days to reconcile (default: 7 days)
                </Text>
              </FormControl>
              
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                Reconciliation will:
                <Text mt={2}>• Match Paystack transactions with local records</Text>
                <Text>• Identify discrepancies in amounts and status</Text>
                <Text>• Update reconciliation status</Text>
                <Text>• Generate discrepancy reports</Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSyncClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={runReconciliation}
              isLoading={syncLoading}
            >
              Run Reconciliation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Paystack;