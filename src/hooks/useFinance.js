import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@chakra-ui/react';
import financeService from '../services/financeService';

const useFinance = (initialFilters = {}) => {
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  
  const { user } = useAuth();
  const toast = useToast();

  // Fetch transactions
  const fetchTransactions = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedFilters = { ...initialFilters, ...filters };
      const { data, count, error: fetchError } = await financeService.getTransactionHistory(mergedFilters);
      
      if (fetchError) throw fetchError;
      
      setTransactions(data || []);
      return { data, count, error: null };
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching transactions',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, count: 0, error: err };
    } finally {
      setLoading(false);
    }
  }, [initialFilters, toast]);

  // Fetch payouts
  const fetchPayouts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedFilters = { ...initialFilters, ...filters };
      const { data, count, error: fetchError } = await financeService.getPendingPayouts(mergedFilters);
      
      if (fetchError) throw fetchError;
      
      setPayouts(data || []);
      return { data, count, error: null };
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching payouts',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, count: 0, error: err };
    } finally {
      setLoading(false);
    }
  }, [initialFilters, toast]);

  // Process payout
  const processPayout = useCallback(async (payoutId, action, notes = '') => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setProcessing(true);
      
      const { data, error: processError } = await financeService.processPayout(
        payoutId,
        action,
        user.id,
        notes
      );
      
      if (processError) throw processError;
      
      // Update local state
      setPayouts(prev => 
        prev.map(payout => 
          payout.id === payoutId 
            ? { ...payout, ...data, status: action === 'approve' ? 'approved' : action }
            : payout
        )
      );
      
      toast({
        title: `Payout ${action === 'approve' ? 'approved' : action}`,
        description: `Payout has been ${action === 'approve' ? 'approved and processed' : action} successfully`,
        status: 'success',
        duration: 3000,
      });
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: `Payout ${action} failed`,
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setProcessing(false);
    }
  }, [user, toast]);

  // Process refund
  const processRefund = useCallback(async (refundData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setProcessing(true);
      
      const { data, error: refundError } = await financeService.processRefund({
        ...refundData,
        processed_by: user.id
      });
      
      if (refundError) throw refundError;
      
      toast({
        title: 'Refund processed',
        description: `Refund of ${refundData.amount} has been processed successfully`,
        status: 'success',
        duration: 3000,
      });
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Refund failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setProcessing(false);
    }
  }, [user, toast]);

  // Get financial statistics
  const fetchFinancialStats = useCallback(async (timeRange = '30d') => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: statsError } = await financeService.getRevenueStatistics(timeRange);
      
      if (statsError) throw statsError;
      
      setStats(data || {});
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      console.error('Error fetching financial stats:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate report
  const generateReport = useCallback(async (reportType, reportFilters = {}) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setProcessing(true);
      
      const { data, error: reportError } = await financeService.getFinancialReports({
        report_type: reportType,
        ...reportFilters
      });
      
      if (reportError) throw reportError;
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Report generation failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setProcessing(false);
    }
  }, [user, toast]);

  // Adjust wallet balance
  const adjustBalance = useCallback(async (walletId, adjustmentData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setProcessing(true);
      
      const { data, error: adjustError } = await financeService.adjustWalletBalance(walletId, {
        ...adjustmentData,
        adjusted_by: user.id
      });
      
      if (adjustError) throw adjustError;
      
      toast({
        title: 'Balance adjusted',
        description: `Wallet balance has been ${adjustmentData.type === 'credit' ? 'increased' : 'decreased'} by ${adjustmentData.amount}`,
        status: 'success',
        duration: 3000,
      });
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Balance adjustment failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setProcessing(false);
    }
  }, [user, toast]);

  // Get revenue trends
  const fetchRevenueTrends = useCallback(async (timeRange = '30d') => {
    try {
      const { data, error: trendsError } = await financeService.getRevenueStatistics(timeRange);
      
      if (trendsError) throw trendsError;
      
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching revenue trends:', err);
      return { data: null, error: err };
    }
  }, []);

  // Export financial data
  const exportFinancialData = useCallback(async (format = 'csv', exportFilters = {}) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setProcessing(true);
      
      const { data, error: exportError } = await financeService.exportFinancialData(format, exportFilters);
      
      if (exportError) throw exportError;
      
      // Create download link
      const blob = new Blob([data.data], { type: data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        description: `Financial data exported as ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
      });
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Export failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setProcessing(false);
    }
  }, [user, toast]);

  // Get wallet analytics
  const getWalletAnalytics = useCallback(async (walletId) => {
    try {
      const { data, error: analyticsError } = await financeService.getWalletDetails(walletId);
      
      if (analyticsError) throw analyticsError;
      
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching wallet analytics:', err);
      return { data: null, error: err };
    }
  }, []);

  // Create payout batch
  const createPayoutBatch = useCallback(async (batchData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      setProcessing(true);
      
      const { data, error: batchError } = await financeService.createPayoutBatch({
        ...batchData,
        created_by: user.id
      });
      
      if (batchError) throw batchError;
      
      toast({
        title: 'Payout batch created',
        description: `Batch created with ${data.summary.successful_payouts} payouts`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh payouts
      await fetchPayouts();
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Batch creation failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setProcessing(false);
    }
  }, [user, fetchPayouts, toast]);

  // Initialize
  useEffect(() => {
    fetchTransactions();
    fetchFinancialStats();
  }, [fetchTransactions, fetchFinancialStats]);

  return {
    // State
    transactions,
    payouts,
    stats,
    loading,
    error,
    processing,
    
    // Actions
    fetchTransactions,
    fetchPayouts,
    processPayout,
    processRefund,
    fetchFinancialStats,
    generateReport,
    adjustBalance,
    fetchRevenueTrends,
    exportFinancialData,
    getWalletAnalytics,
    createPayoutBatch,
    
    // Helper functions
    refresh: () => {
      fetchTransactions();
      fetchPayouts();
      fetchFinancialStats();
    },
    reset: () => {
      setTransactions([]);
      setPayouts([]);
      setStats({});
      setError(null);
      fetchTransactions();
      fetchPayouts();
      fetchFinancialStats();
    },
    
    // Computed values
    totalTransactions: transactions.length,
    totalPayouts: payouts.length,
    totalPayoutAmount: payouts.reduce((sum, payout) => sum + payout.amount, 0),
    pendingPayouts: payouts.filter(p => p.status === 'pending'),
    hasData: transactions.length > 0 || payouts.length > 0
  };
};

export default useFinance;