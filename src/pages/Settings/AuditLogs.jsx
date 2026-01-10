import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Select,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Heading,
  Badge,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tag,
  TagLabel,
  TagCloseButton,
  Avatar,
  IconButton,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Code,
  Tooltip,
  Skeleton,
} from '@chakra-ui/react';
import { 
  FaHistory, 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaTrash,
  FaEye,
  FaFileExport,
  FaChartBar,
  FaSync,
  FaUndo,
  FaTimesCircle,
  FaUser,
  FaInfoCircle,
  FaExclamationTriangle,
  FaDatabase,
  FaServer,
  FaClock,
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer';
import SettingsMenu from '../../components/SettingsMenu';
import { supabase } from '../../services/supabase';

const AuditLogs = () => {
  const toast = useToast();
  
  // State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    target_type: '',
    date_from: '',
    date_to: '',
    severity: '',
    search_query: '',
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  
  // Statistics
  const [statistics, setStatistics] = useState({
    total_logs: 0,
    logs_today: 0,
    logs_this_week: 0,
    logs_this_month: 0,
    most_common_action: '',
    top_admin: '',
  });
  
  // Modals
  const { isOpen: isDetailsModalOpen, onOpen: onDetailsModalOpen, onClose: onDetailsModalClose } = useDisclosure();
  const { isOpen: isFilterModalOpen, onOpen: onFilterModalOpen, onClose: onFilterModalClose } = useDisclosure();
  const { isOpen: isStatsModalOpen, onOpen: onStatsModalOpen, onClose: onStatsModalClose } = useDisclosure();
  const { isOpen: isExportModalOpen, onOpen: onExportModalOpen, onClose: onExportModalClose } = useDisclosure();
  
  const [selectedLog, setSelectedLog] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // Constants
  const actionTypes = [
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT',
    'SUSPEND', 'ACTIVATE', 'DEACTIVATE', 'PAYMENT', 'REFUND', 'SETTINGS_UPDATE',
    'ROLE_CHANGE', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'NOTIFICATION_SEND',
    'REPORT_GENERATE', 'DATA_EXPORT', 'SYSTEM_BACKUP', 'SYSTEM_STARTUP'
  ];
  
  const targetTypes = [
    'USER', 'DRIVER', 'RIDER', 'RIDE', 'PAYMENT', 'TRANSACTION', 'VEHICLE',
    'DOCUMENT', 'SETTINGS', 'ROLE', 'PERMISSION', 'NOTIFICATION', 'REPORT',
    'SYSTEM', 'AUDIT_LOG', 'PROFILE'
  ];
  
  const severityLevels = [
    { value: 'info', label: 'Info', color: 'blue' },
    { value: 'warning', label: 'Warning', color: 'yellow' },
    { value: 'error', label: 'Error', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' },
    { value: 'security', label: 'Security', color: 'purple' },
  ];

  // Fetch audit logs from the view
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('vw_audit_logs_enriched')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.target_type) {
        query = query.eq('target_type', filters.target_type);
      }
      
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      
      if (filters.date_from) {
        const fromDate = new Date(filters.date_from);
        fromDate.setHours(0, 0, 0, 0);
        query = query.gte('created_at', fromDate.toISOString());
      }
      
      if (filters.date_to) {
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', toDate.toISOString());
      }
      
      if (filters.search_query) {
        const search = filters.search_query.toLowerCase();
        query = query.or(`
          action.ilike.%${search}%,
          details.ilike.%${search}%,
          target_id.ilike.%${search}%,
          admin_name.ilike.%${search}%,
          admin_email.ilike.%${search}%
        `);
      }
      
      // Apply pagination
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      
      const { data, error, count } = await query.range(from, to);
      
      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }
      
      // Filter out any mock data that might still exist
      const filteredData = (data || []).filter(log => 
        !(log.ip_address && log.ip_address.toString().includes('192.168.1.')) &&
        !(log.admin_id === null && log.details?.includes('logged in successfully'))
      );
      
      setAuditLogs(filteredData);
      
      if (count !== null) {
        setPagination(prev => ({
          ...prev,
          total: count,
          totalPages: Math.ceil(count / pagination.limit)
        }));
      }
      
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast({
        title: 'Failed to load audit logs',
        description: error.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, toast]);

  // Fetch statistics using the new function
  const fetchStatistics = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      // Use the new fn_get_audit_statistics function
      const { data: statsData, error } = await supabase
        .rpc('fn_get_audit_statistics')
        .single();
      
      if (error) {
        console.error('RPC error:', error);
        // Fallback to manual calculation
        await fetchManualStatistics();
      } else {
        setStatistics({
          total_logs: statsData.total_logs || 0,
          logs_today: statsData.logs_today || 0,
          logs_this_week: statsData.logs_this_week || 0,
          logs_this_month: statsData.logs_this_month || 0,
          most_common_action: statsData.most_common_action || 'No data',
          top_admin: statsData.top_admin || 'No admin data',
        });
      }
      
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      await fetchManualStatistics();
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Manual statistics calculation (fallback)
  const fetchManualStatistics = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const [totalRes, todayRes, weekRes, monthRes] = await Promise.all([
        supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
        supabase.from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayStart.toISOString()),
        supabase.from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString()),
        supabase.from('audit_logs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthAgo.toISOString()),
      ]);
      
      setStatistics({
        total_logs: totalRes.count || 0,
        logs_today: todayRes.count || 0,
        logs_this_week: weekRes.count || 0,
        logs_this_month: monthRes.count || 0,
        most_common_action: 'N/A',
        top_admin: 'N/A',
      });
    } catch (fallbackError) {
      console.error('Manual statistics also failed:', fallbackError);
    }
  };

  // Apply filters
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAuditLogs();
    onFilterModalClose();
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      action: '',
      target_type: '',
      date_from: '',
      date_to: '',
      severity: '',
      search_query: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAuditLogs();
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Refresh all data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchAuditLogs(), fetchStatistics()]);
      toast({
        title: 'Refreshed',
        description: 'Audit logs and statistics updated',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // View log details
  const viewLogDetails = (log) => {
    setSelectedLog(log);
    onDetailsModalOpen();
  };

  // Export logs
  const exportLogs = async () => {
    try {
      setExporting(true);
      
      let query = supabase
        .from('vw_audit_logs_enriched')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000);
      
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to + 'T23:59:59');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const headers = ['Timestamp', 'Action', 'Admin Name', 'Admin Email', 'Target Type', 'Target ID', 'IP Address', 'Severity', 'Details'];
        const rows = data.map(log => [
          new Date(log.created_at).toISOString(),
          log.action,
          log.admin_name || 'System',
          log.admin_email || 'System',
          log.target_type || '',
          log.target_id || '',
          log.ip_address || '',
          log.severity,
          log.details || ''
        ]);
        
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: 'Export successful',
          description: `Exported ${data.length} audit logs`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'No data to export',
          description: 'No audit logs match your criteria',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: error.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
      onExportModalClose();
    }
  };

  // Helper functions
  const getActionBadgeColor = (action) => {
    if (action.includes('DELETE') || action.includes('REMOVE')) return 'red';
    if (action.includes('CREATE') || action.includes('ADD')) return 'green';
    if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('CHANGE')) return 'blue';
    if (action.includes('SUSPEND') || action.includes('REJECT') || action.includes('DEACTIVATE')) return 'orange';
    if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('SECURITY')) return 'purple';
    if (action.includes('PAYMENT') || action.includes('REFUND')) return 'teal';
    if (action.includes('SYSTEM')) return 'gray';
    return 'gray';
  };

  const getSeverityBadgeColor = (severity) => {
    const level = severityLevels.find(l => l.value === severity);
    return level ? level.color : 'gray';
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatIP = (ip) => {
    if (!ip) return 'N/A';
    return ip.toString().replace(/^::ffff:/, '');
  };

  // Create a test audit log (for development/testing)
  const createTestAuditLog = async () => {
    try {
      const { error } = await supabase.rpc('fn_log_audit_action', {
        p_action: 'TEST_ACTION',
        p_target_type: 'TEST',
        p_target_id: 'test_' + Date.now(),
        p_details: 'Test audit log created from UI',
        p_severity: 'info'
      });
      
      if (error) throw error;
      
      toast({
        title: 'Test log created',
        description: 'Refresh to see the new audit log',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Failed to create test log:', error);
      toast({
        title: 'Failed to create test log',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Initialize data
  useEffect(() => {
    fetchAuditLogs();
    fetchStatistics();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          console.log('New real audit log received:', payload.new);
          
          // Filter out any mock data in real-time
          if (!(payload.new.ip_address && payload.new.ip_address.toString().includes('192.168.1.'))) {
            setAuditLogs(prev => [payload.new, ...prev.slice(0, -1)]);
            fetchStatistics();
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-fetch when pagination changes
  useEffect(() => {
    if (pagination.page > 1) {
      fetchAuditLogs();
    }
  }, [pagination.page]);

  return (
    <PageContainer 
      title="Audit Logs" 
      subtitle="Real-time system audit trail and security monitoring"
    >
      <Flex gap={6}>
        <SettingsMenu />
        
        <Box flex={1}>
          {/* Header Section */}
          <Card mb={6} variant="outline">
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="md">Audit Trail System</Heading>
                  <Text color="gray.600" fontSize="sm" mt={1}>
                    {loadingStats ? (
                      <Skeleton height="20px" width="200px" />
                    ) : (
                      `${statistics.total_logs} total logs • ${statistics.logs_today} today • Real-time monitoring`
                    )}
                  </Text>
                </Box>
                <HStack spacing={3}>
                  <Button
                    leftIcon={<FaSync />}
                    colorScheme="gray"
                    variant="outline"
                    size="sm"
                    isLoading={refreshing}
                    onClick={handleRefresh}
                    isDisabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button
                    leftIcon={<FaChartBar />}
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                    onClick={onStatsModalOpen}
                    isDisabled={loadingStats}
                  >
                    Statistics
                  </Button>
                  <Button
                    leftIcon={<FaFileExport />}
                    colorScheme="green"
                    size="sm"
                    onClick={onExportModalOpen}
                    isDisabled={auditLogs.length === 0}
                  >
                    Export
                  </Button>
                </HStack>
              </Flex>
            </CardBody>
          </Card>
          
          {/* Filters Section */}
          <Card mb={6} variant="outline">
            <CardBody p={4}>
              <Flex gap={4} align="center">
                <InputGroup flex={1}>
                  <InputLeftElement>
                    <Icon as={FaSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search audit logs..."
                    value={filters.search_query}
                    onChange={(e) => handleFilterChange('search_query', e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                    isDisabled={loading}
                  />
                  {filters.search_query && (
                    <InputRightElement>
                      <IconButton
                        icon={<FaTimesCircle />}
                        size="xs"
                        variant="ghost"
                        onClick={() => handleFilterChange('search_query', '')}
                        aria-label="Clear search"
                        isDisabled={loading}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
                
                <HStack spacing={2}>
                  <Button
                    leftIcon={<FaFilter />}
                    colorScheme="gray"
                    variant="outline"
                    size="sm"
                    onClick={onFilterModalOpen}
                    isDisabled={loading}
                  >
                    Filters
                    {Object.values(filters).some(v => v && v !== '') && (
                      <Badge ml={2} colorScheme="blue" borderRadius="full" px={2}>
                        Active
                      </Badge>
                    )}
                  </Button>
                </HStack>
              </Flex>
              
              {/* Active Filters */}
              {Object.values(filters).some(v => v && v !== '') && (
                <HStack mt={3} spacing={2} flexWrap="wrap">
                  <Text fontSize="sm" color="gray.600">Active filters:</Text>
                  {filters.action && (
                    <Tag size="sm" colorScheme="blue">
                      Action: {filters.action}
                      <TagCloseButton onClick={() => handleFilterChange('action', '')} />
                    </Tag>
                  )}
                  {filters.target_type && (
                    <Tag size="sm" colorScheme="green">
                      Target: {filters.target_type}
                      <TagCloseButton onClick={() => handleFilterChange('target_type', '')} />
                    </Tag>
                  )}
                  {filters.severity && (
                    <Tag size="sm" colorScheme={getSeverityBadgeColor(filters.severity)}>
                      Severity: {filters.severity}
                      <TagCloseButton onClick={() => handleFilterChange('severity', '')} />
                    </Tag>
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="gray"
                    onClick={clearFilters}
                    leftIcon={<FaUndo />}
                    isDisabled={loading}
                  >
                    Clear all
                  </Button>
                </HStack>
              )}
            </CardBody>
          </Card>
          
          {/* Audit Logs Table */}
          <Card variant="outline">
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Audit Logs</Heading>
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    size="sm"
                    colorScheme="gray"
                    variant="outline"
                    onClick={createTestAuditLog}
                    isDisabled={loading}
                  >
                    Create Test Log
                  </Button>
                )}
              </Flex>
            </CardHeader>
            <Divider />
            <CardBody p={0}>
              {loading && auditLogs.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Spinner size="lg" />
                  <Text mt={4} color="gray.600">Loading audit logs...</Text>
                </Box>
              ) : auditLogs.length === 0 ? (
                <Box p={8} textAlign="center">
                  <Icon as={FaHistory} boxSize="48px" color="gray.300" mb={4} />
                  <Text color="gray.500" fontSize="lg" fontWeight="medium">
                    No audit logs found
                  </Text>
                  <Text fontSize="sm" color="gray.400" mt={2}>
                    {Object.values(filters).some(v => v && v !== '') 
                      ? 'Try adjusting your filters' 
                      : 'Audit logs will appear here as administrators perform actions'}
                  </Text>
                  <Button
                    mt={4}
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                  >
                    Check for new logs
                  </Button>
                </Box>
              ) : (
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Timestamp</Th>
                      <Th>Action</Th>
                      <Th>Admin</Th>
                      <Th>Target</Th>
                      <Th>IP</Th>
                      <Th>Severity</Th>
                      <Th textAlign="right">Details</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {auditLogs.map((log) => (
                      <Tr key={log.id} _hover={{ bg: 'gray.50' }} transition="background 0.2s">
                        <Td>
                          <Text fontSize="sm" color="gray.700" fontFamily="mono">
                            {formatTimestamp(log.created_at)}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getActionBadgeColor(log.action)}
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="md"
                            textTransform="uppercase"
                          >
                            {log.action}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Avatar
                              size="xs"
                              name={log.admin_name}
                              bg={log.actor_type === 'system' ? 'purple.500' : 'blue.500'}
                            />
                            <Box>
                              <Text fontSize="sm" fontWeight="medium">
                                {log.admin_name || 'System'}
                              </Text>
                              {log.admin_email && log.admin_email !== 'System' && (
                                <Text fontSize="xs" color="gray.500">
                                  {log.admin_email}
                                </Text>
                              )}
                            </Box>
                          </HStack>
                        </Td>
                        <Td>
                          <Box>
                            <Text fontSize="sm" fontWeight="medium">
                              {log.target_type || 'N/A'}
                            </Text>
                            {log.target_id && (
                              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                                {log.target_id}
                              </Text>
                            )}
                          </Box>
                        </Td>
                        <Td>
                          <Code fontSize="xs" color="gray.600">
                            {formatIP(log.ip_address)}
                          </Code>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getSeverityBadgeColor(log.severity)}
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            {log.severity}
                          </Badge>
                        </Td>
                        <Td textAlign="right">
                          <IconButton
                            icon={<FaEye />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => viewLogDetails(log)}
                            aria-label="View details"
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
            
            {/* Pagination */}
            {pagination.totalPages > 1 && !loading && auditLogs.length > 0 && (
              <CardFooter borderTop="1px" borderColor="gray.200">
                <Flex justify="space-between" align="center" width="100%">
                  <Text fontSize="sm" color="gray.600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} logs
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      isDisabled={pagination.page === 1 || loading}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={pagination.page === pageNum ? 'solid' : 'outline'}
                          colorScheme={pagination.page === pageNum ? 'blue' : 'gray'}
                          onClick={() => handlePageChange(pageNum)}
                          isDisabled={loading}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      isDisabled={pagination.page === pagination.totalPages || loading}
                    >
                      Next
                    </Button>
                  </HStack>
                </Flex>
              </CardFooter>
            )}
          </Card>
          
          {/* Real-time Indicator */}
          {auditLogs.length > 0 && (
            <Alert status="info" borderRadius="md" mt={6} variant="left-accent">
              <AlertIcon />
              <Box>
                <AlertTitle>Real-time Monitoring Active</AlertTitle>
                <AlertDescription fontSize="sm">
                  New audit logs appear instantly as administrators perform actions.
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </Box>
      </Flex>
      
      {/* Log Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={onDetailsModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Audit Log Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedLog && (
              <VStack spacing={4} align="stretch">
                <Card variant="outline">
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Action:</Text>
                        <Badge
                          colorScheme={getActionBadgeColor(selectedLog.action)}
                          fontSize="sm"
                          px={3}
                          py={1}
                        >
                          {selectedLog.action}
                        </Badge>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Timestamp:</Text>
                        <Text fontFamily="mono">{formatTimestamp(selectedLog.created_at)}</Text>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Admin:</Text>
                        <Box textAlign="right">
                          <Text>{selectedLog.admin_name || 'System'}</Text>
                          {selectedLog.admin_email && selectedLog.admin_email !== 'System' && (
                            <Text fontSize="sm" color="gray.600">
                              {selectedLog.admin_email}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Target:</Text>
                        <Box textAlign="right">
                          <Text>{selectedLog.target_type || 'N/A'}</Text>
                          {selectedLog.target_id && (
                            <Text fontSize="sm" color="gray.600" fontFamily="mono">
                              ID: {selectedLog.target_id}
                            </Text>
                          )}
                        </Box>
                      </HStack>
                      
                      {selectedLog.ip_address && (
                        <HStack justify="space-between">
                          <Text fontWeight="bold">IP Address:</Text>
                          <Code>{formatIP(selectedLog.ip_address)}</Code>
                        </HStack>
                      )}
                      
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Severity:</Text>
                        <Badge
                          colorScheme={getSeverityBadgeColor(selectedLog.severity)}
                          fontSize="sm"
                        >
                          {selectedLog.severity}
                        </Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
                
                {(selectedLog.details || selectedLog.metadata) && (
                  <Card variant="outline">
                    <CardHeader pb={3}>
                      <Heading size="sm">Additional Information</Heading>
                    </CardHeader>
                    <CardBody>
                      {selectedLog.details && (
                        <Box mb={4}>
                          <Text fontWeight="medium" mb={2}>Details:</Text>
                          <Box bg="gray.50" p={3} borderRadius="md">
                            <Text fontSize="sm">{selectedLog.details}</Text>
                          </Box>
                        </Box>
                      )}
                      
                      {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                        <Box>
                          <Text fontWeight="medium" mb={2}>Metadata:</Text>
                          <Box
                            bg="gray.50"
                            p={3}
                            borderRadius="md"
                            maxH="200px"
                            overflowY="auto"
                          >
                            <Code
                              display="block"
                              whiteSpace="pre-wrap"
                              fontSize="sm"
                              color="gray.700"
                            >
                              {JSON.stringify(selectedLog.metadata, null, 2)}
                            </Code>
                          </Box>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDetailsModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Statistics Modal */}
      <Modal isOpen={isStatsModalOpen} onClose={onStatsModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Audit Log Statistics</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {loadingStats ? (
              <Box textAlign="center" py={8}>
                <Spinner size="lg" />
                <Text mt={4}>Loading statistics...</Text>
              </Box>
            ) : (
              <>
                <StatGroup gap={6} mb={6}>
                  <Stat>
                    <StatLabel>Total Logs</StatLabel>
                    <StatNumber>{statistics.total_logs.toLocaleString()}</StatNumber>
                    <StatHelpText>All time</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>Today</StatLabel>
                    <StatNumber>{statistics.logs_today.toLocaleString()}</StatNumber>
                    <StatHelpText>Last 24 hours</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>This Week</StatLabel>
                    <StatNumber>{statistics.logs_this_week.toLocaleString()}</StatNumber>
                    <StatHelpText>Last 7 days</StatHelpText>
                  </Stat>
                  
                  <Stat>
                    <StatLabel>This Month</StatLabel>
                    <StatNumber>{statistics.logs_this_month.toLocaleString()}</StatNumber>
                    <StatHelpText>Last 30 days</StatHelpText>
                  </Stat>
                </StatGroup>
                
                <Divider my={4} />
                
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontWeight="bold" mb={2}>Most Common Action:</Text>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      {statistics.most_common_action}
                    </Badge>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Most Active Admin:</Text>
                    <HStack>
                      <Avatar size="sm" name={statistics.top_admin} />
                      <Text>{statistics.top_admin}</Text>
                    </HStack>
                  </Box>
                </VStack>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onStatsModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Export Modal */}
      <Modal isOpen={isExportModalOpen} onClose={onExportModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Export Audit Logs</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Export Options</AlertTitle>
                  <AlertDescription>
                    Export all logs matching your current filters as CSV file.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <Text fontSize="sm" color="gray.600">
                {filters.date_from || filters.date_to 
                  ? `Exporting logs${filters.date_from ? ` from ${filters.date_from}` : ''}${filters.date_to ? ` to ${filters.date_to}` : ''}`
                  : 'Exporting all audit logs'}
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="green" 
              onClick={exportLogs}
              isLoading={exporting}
              leftIcon={<FaDownload />}
            >
              Export to CSV
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default AuditLogs;