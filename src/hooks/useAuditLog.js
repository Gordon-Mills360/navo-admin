import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@chakra-ui/react';
import auditService from '../services/auditService';

const useAuditLog = (initialFilters = {}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  
  const { user } = useAuth();
  const toast = useToast();

  // Fetch logs with filters
  const fetchLogs = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedFilters = {
        ...initialFilters,
        ...filters,
        page: filters.page || pagination.page,
        limit: filters.limit || pagination.limit
      };
      
      const { data, count, error: fetchError } = await auditService.getAuditLogs(mergedFilters);
      
      if (fetchError) throw fetchError;
      
      setLogs(data || []);
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / mergedFilters.limit),
        page: mergedFilters.page,
        limit: mergedFilters.limit
      }));
      
      return { data, count };
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching audit logs',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, count: 0, error: err };
    } finally {
      setLoading(false);
    }
  }, [initialFilters, pagination.page, pagination.limit, toast]);

  // Log an admin action
  const logAction = useCallback(async (actionData) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const logData = {
        ...actionData,
        admin_id: user.id,
        ip_address: 'admin_panel',
        user_agent: navigator.userAgent
      };
      
      const { data, error: logError } = await auditService.logAdminAction(logData);
      
      if (logError) throw logError;
      
      // Optionally refresh logs
      // await fetchLogs();
      
      return { data, error: null };
    } catch (err) {
      console.error('Error logging action:', err);
      // Don't show toast for log errors to avoid disrupting user flow
      return { data: null, error: err };
    }
  }, [user]);

  // Get log statistics
  const fetchStats = useCallback(async (timeRange = '24h') => {
    try {
      const { data, error: statsError } = await auditService.getActionStatistics(timeRange);
      
      if (statsError) throw statsError;
      
      setStats(data || {});
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching statistics',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    }
  }, [toast]);

  // Clear old logs
  const clearLogs = useCallback(async (days = 90) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error: clearError } = await auditService.clearOldLogs(days);
      
      if (clearError) throw clearError;
      
      toast({
        title: 'Logs cleared',
        description: `Cleared logs older than ${days} days`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh current logs
      await fetchLogs();
      
      return { data, error: null };
    } catch (err) {
      toast({
        title: 'Error clearing logs',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    }
  }, [user, fetchLogs, toast]);

  // Export logs
  const exportLogs = useCallback(async (format = 'csv', exportFilters = {}) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const mergedFilters = { ...initialFilters, ...exportFilters };
      const { data, error: exportError } = await auditService.exportAuditLogs(format, mergedFilters);
      
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
        description: `Logs exported as ${format.toUpperCase()}`,
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
    }
  }, [user, initialFilters, toast]);

  // Search logs
  const searchLogs = useCallback(async (query, searchFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const mergedFilters = { ...initialFilters, ...searchFilters, search: query };
      const { data, count, error: searchError } = await auditService.searchAuditLogs(query, mergedFilters);
      
      if (searchError) throw searchError;
      
      setLogs(data || []);
      setPagination(prev => ({
        ...prev,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / (searchFilters.limit || 50))
      }));
      
      return { data, count, error: null };
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Search failed',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, count: 0, error: err };
    } finally {
      setLoading(false);
    }
  }, [initialFilters, toast]);

  // Get logs for specific resource
  const getResourceLogs = useCallback(async (resourceType, resourceId, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: resourceError } = await auditService.getResourceActivity(resourceType, resourceId, limit);
      
      if (resourceError) throw resourceError;
      
      setLogs(data || []);
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching resource logs',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get admin-specific logs
  const getAdminLogs = useCallback(async (adminId, timeRange = '7d') => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: adminError } = await auditService.getAdminActivity(adminId, timeRange);
      
      if (adminError) throw adminError;
      
      setLogs(data || []);
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error fetching admin logs',
        description: err.message,
        status: 'error',
        duration: 5000,
      });
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Change page
  const changePage = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchLogs({ page: newPage });
  }, [fetchLogs]);

  // Change limit
  const changeLimit = useCallback((newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
    fetchLogs({ limit: newLimit, page: 1 });
  }, [fetchLogs]);

  // Get recent activity
  const getRecentActivity = useCallback(async (limit = 10) => {
    try {
      const { data, error: recentError } = await auditService.getRecentActivitySummary(limit);
      
      if (recentError) throw recentError;
      
      return { data, error: null };
    } catch (err) {
      console.error('Error fetching recent activity:', err);
      return { data: null, error: err };
    }
  }, []);

  // Initialize
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    // State
    logs,
    loading,
    error,
    stats,
    pagination,
    
    // Actions
    fetchLogs,
    logAction,
    fetchStats,
    clearLogs,
    exportLogs,
    searchLogs,
    getResourceLogs,
    getAdminLogs,
    changePage,
    changeLimit,
    getRecentActivity,
    
    // Helper functions
    refresh: () => fetchLogs(),
    reset: () => {
      setLogs([]);
      setError(null);
      setStats({});
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      });
      fetchLogs();
    }
  };
};

export default useAuditLog;