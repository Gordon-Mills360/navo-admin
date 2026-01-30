// admin-panel/src/pages/Transactions.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useToast,
  IconButton,
  Tooltip,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  SimpleGrid,
  Grid,
  GridItem,
  Tag,
  TagLabel,
  HStack,
} from '@chakra-ui/react';
import {
  SearchIcon,
  DownloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  FilterIcon,
  ViewIcon,
  RepeatIcon,
} from '@chakra-ui/icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { supabase } from '../lib/supabaseClient';
import { formatCurrency } from '../utils/formatters';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    minAmount: null,
    maxAmount: null,
    transactionType: 'all',
    sourceType: 'all',
    status: 'all',
    userRole: 'all',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 15;
  
  const toast = useToast();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  
  // Transaction type options
  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'credit', label: 'Credits', color: 'green' },
    { value: 'debit', label: 'Debits', color: 'red' },
    { value: 'transfer', label: 'Transfers', color: 'blue' },
    { value: 'hold', label: 'Holds', color: 'orange' },
    { value: 'release', label: 'Releases', color: 'purple' },
  ];

  // Source type options
  const sourceTypes = [
    { value: 'all', label: 'All Sources' },
    { value: 'paystack_funding', label: 'Paystack Funding' },
    { value: 'mobile_money_funding', label: 'Mobile Money' },
    { value: 'ride_payment', label: 'Ride Payment' },
    { value: 'ride_earning', label: 'Ride Earnings' },
    { value: 'commission', label: 'Commission' },
    { value: 'payout', label: 'Payout' },
    { value: 'refund', label: 'Refund' },
    { value: 'admin_adjustment', label: 'Admin Adjustment' },
  ];

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'failed', label: 'Failed', color: 'red' },
    { value: 'reversed', label: 'Reversed', color: 'gray' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' },
  ];

  // User role options
  const userRoleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'passenger', label: 'Passenger' },
    { value: 'driver', label: 'Driver' },
    { value: 'admin', label: 'Admin' },
    { value: 'system', label: 'System' },
  ];

  // Load transactions
  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      
      // Calculate offset for pagination
      const offset = (page - 1) * itemsPerPage;
      
      // Build query
      let query = supabase
        .from('wallet_transactions')
        .select(`
          *,
          wallet:wallet_id (
            id,
            user_id,
            role,
            user:user_id (
              id,
              full_name,
              email,
              phone,
              role
            )
          )
        `, { count: 'exact' });
      
      // Apply search
      if (searchTerm) {
        query = query.or(
          `external_reference.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,wallet.user.full_name.ilike.%${searchTerm}%,wallet.user.email.ilike.%${searchTerm}%`
        );
      }
      
      // Apply filters
      if (filters.transactionType !== 'all') {
        query = query.eq('transaction_type', filters.transactionType);
      }
      
      if (filters.sourceType !== 'all') {
        query = query.eq('source_type', filters.sourceType);
      }
      
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.userRole !== 'all') {
        query = query.eq('wallet.role', filters.userRole);
      }
      
      if (filters.minAmount) {
        query = query.gte('amount', parseFloat(filters.minAmount));
      }
      
      if (filters.maxAmount) {
        query = query.lte('amount', parseFloat(filters.maxAmount));
      }
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }
      
      // Get total count first
      const { count } = await query;
      setTotalPages(Math.ceil(count / itemsPerPage));
      
      // Get paginated data
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + itemsPerPage - 1);
      
      if (error) throw error;
      
      setTransactions(data || []);
      
      // Load stats
      await loadStats();
      
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load transaction statistics
  const loadStats = async () => {
    try {
      // Get date range for stats
      const startDate = filters.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = filters.endDate || new Date();
      
      // Build stats query - simple query without joins
      let statsQuery = supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact' });
      
      if (filters.startDate) {
        statsQuery = statsQuery.gte('created_at', filters.startDate.toISOString());
      } else {
        statsQuery = statsQuery.gte('created_at', startDate.toISOString());
      }
      
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        statsQuery = statsQuery.lte('created_at', end.toISOString());
      } else {
        statsQuery = statsQuery.lte('created_at', endDate.toISOString());
      }
      
      if (filters.transactionType !== 'all') {
        statsQuery = statsQuery.eq('transaction_type', filters.transactionType);
      }
      
      if (filters.sourceType !== 'all') {
        statsQuery = statsQuery.eq('source_type', filters.sourceType);
      }
      
      if (filters.status !== 'all') {
        statsQuery = statsQuery.eq('status', filters.status);
      }
      
      // For user role filter in stats, we need to get wallet transactions with specific wallet roles
      if (filters.userRole !== 'all') {
        // First get wallet IDs with the specified role
        const { data: wallets, error: walletsError } = await supabase
          .from('wallets')
          .select('id')
          .eq('role', filters.userRole);
        
        if (walletsError) throw walletsError;
        
        if (wallets && wallets.length > 0) {
          const walletIds = wallets.map(w => w.id);
          statsQuery = statsQuery.in('wallet_id', walletIds);
        } else {
          // If no wallets found with that role, set empty stats
          setStats({
            totalTransactions: 0,
            totalAmount: 0,
            totalCredits: 0,
            totalDebits: 0,
            completed: 0,
            pending: 0,
            failed: 0,
            averageAmount: 0,
          });
          return;
        }
      }
      
      const { data: statsData, error: statsError } = await statsQuery;
      
      if (statsError) throw statsError;
      
      const calculatedStats = {
        totalTransactions: statsData.length,
        totalAmount: 0,
        totalCredits: 0,
        totalDebits: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        averageAmount: 0,
      };
      
      statsData.forEach(transaction => {
        const amount = parseFloat(transaction.amount || 0);
        calculatedStats.totalAmount += amount;
        
        if (transaction.transaction_type === 'credit') {
          calculatedStats.totalCredits += amount;
        } else if (transaction.transaction_type === 'debit') {
          calculatedStats.totalDebits += amount;
        }
        
        if (transaction.status === 'completed') {
          calculatedStats.completed++;
        } else if (transaction.status === 'pending') {
          calculatedStats.pending++;
        } else if (transaction.status === 'failed') {
          calculatedStats.failed++;
        }
      });
      
      calculatedStats.averageAmount = calculatedStats.totalTransactions > 0 
        ? calculatedStats.totalAmount / calculatedStats.totalTransactions 
        : 0;
      
      setStats(calculatedStats);
      
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't show toast for stats error - it's not critical
    }
  };

  // Load transaction details
  const loadTransactionDetails = async (transactionId) => {
    try {
      // First get the wallet transaction
      const { data: transaction, error: transError } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          wallet:wallet_id (
            id,
            user_id,
            role,
            balance,
            currency,
            user:user_id (
              id,
              full_name,
              email,
              phone,
              role
            )
          )
        `)
        .eq('id', transactionId)
        .single();
      
      if (transError) throw transError;
      
      if (transaction) {
        // Get paystack transaction separately - using wallet_transaction_id
        const { data: paystackData, error: paystackError } = await supabase
          .from('paystack_transactions')
          .select('*')
          .eq('wallet_transaction_id', transactionId);
        
        // Get payout separately - using wallet_transaction_id
        let payoutData = null;
        let payoutError = null;
        
        try {
          const { data: payoutResult, error: payoutResultError } = await supabase
            .from('payouts')
            .select('*')
            .eq('wallet_transaction_id', transactionId);
          
          payoutData = payoutResult;
          payoutError = payoutResultError;
        } catch (err) {
          console.log('No payout found or error fetching payout:', err);
          // It's okay if payout doesn't exist
        }
        
        // Combine all data
        const combinedData = {
          ...transaction,
          paystack_transaction: paystackData && paystackData.length > 0 ? paystackData[0] : null,
          payout: payoutData && payoutData.length > 0 ? payoutData[0] : null
        };
        
        setTransactionDetails(combinedData);
        onDetailsOpen();
      }
      
    } catch (error) {
      console.error('Error loading transaction details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transaction details',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Build export query
      let query = supabase
        .from('wallet_transactions')
        .select(`
          id,
          transaction_type,
          source_type,
          amount,
          currency,
          balance_before,
          balance_after,
          status,
          external_reference,
          description,
          created_at,
          wallet:wallet_id (
            user:user_id (
              full_name,
              email,
              role
            )
          )
        `);
      
      // Apply filters for export
      if (filters.transactionType !== 'all') {
        query = query.eq('transaction_type', filters.transactionType);
      }
      
      if (filters.sourceType !== 'all') {
        query = query.eq('source_type', filters.sourceType);
      }
      
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.userRole !== 'all') {
        query = query.eq('wallet.user.role', filters.userRole);
      }
      
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Convert to CSV
      const csvRows = [];
      const headers = [
        'Transaction ID',
        'Date',
        'User Name',
        'User Email',
        'User Role',
        'Transaction Type',
        'Source Type',
        'Amount',
        'Currency',
        'Balance Before',
        'Balance After',
        'Status',
        'External Reference',
        'Description'
      ];
      
      csvRows.push(headers.join(','));
      
      data.forEach(transaction => {
        const row = [
          transaction.id,
          new Date(transaction.created_at).toISOString(),
          transaction.wallet?.user?.full_name || '',
          transaction.wallet?.user?.email || '',
          transaction.wallet?.user?.role || '',
          transaction.transaction_type,
          transaction.source_type,
          transaction.amount,
          transaction.currency,
          transaction.balance_before,
          transaction.balance_after,
          transaction.status,
          transaction.external_reference || '',
          transaction.description || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        
        csvRows.push(row);
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast({
        title: 'Export Complete',
        description: 'Transactions data exported successfully',
        status: 'success',
        duration: 3000,
      });
      
    } catch (error) {
      console.error('Error exporting transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to export transactions data',
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      minAmount: null,
      maxAmount: null,
      transactionType: 'all',
      sourceType: 'all',
      status: 'all',
      userRole: 'all',
    });
    setCurrentPage(1);
  };

  // Apply filters and reload
  const applyFilters = () => {
    setCurrentPage(1);
    loadTransactions(1);
    setShowFilters(false);
  };

  // Format source type for display
  const formatSourceType = (sourceType) => {
    const sourceMap = {
      'paystack_funding': 'Paystack',
      'mobile_money_funding': 'Mobile Money',
      'ride_payment': 'Ride Payment',
      'ride_earning': 'Ride Earnings',
      'commission': 'Commission',
      'payout': 'Payout',
      'refund': 'Refund',
      'admin_adjustment': 'Admin Adjustment',
      'referral_bonus': 'Referral Bonus',
      'promotional_bonus': 'Promotional',
      'penalty_fee': 'Penalty',
      'system_correction': 'System',
    };
    
    return sourceMap[sourceType] || sourceType;
  };

  // Initial load
  useEffect(() => {
    loadTransactions();
  }, []);

  // Handle search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadTransactions(1);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  return (
    <Box p={6}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Transaction Management</Heading>
        <Flex gap={3}>
          <Button
            leftIcon={<FilterIcon />}
            colorScheme={Object.values(filters).some(f => f !== null && f !== 'all') ? 'orange' : 'gray'}
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
            {Object.values(filters).some(f => f !== null && f !== 'all') && (
              <Tag size="sm" colorScheme="orange" ml={2}>
                Active
              </Tag>
            )}
          </Button>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="blue"
            onClick={handleExport}
          >
            Export
          </Button>
        </Flex>
      </Flex>

      {/* Stats Cards */}
      {stats && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <Stat>
            <StatLabel>Total Transactions</StatLabel>
            <StatNumber>{stats.totalTransactions}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Total Amount</StatLabel>
            <StatNumber>{formatCurrency(stats.totalAmount)}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Total Credits</StatLabel>
            <StatNumber>{formatCurrency(stats.totalCredits)}</StatNumber>
          </Stat>
          
          <Stat>
            <StatLabel>Total Debits</StatLabel>
            <StatNumber>{formatCurrency(stats.totalDebits)}</StatNumber>
          </Stat>
        </SimpleGrid>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" mb={6}>
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Filters</Heading>
            <Flex gap={2}>
              <Button
                size="sm"
                leftIcon={<RepeatIcon />}
                onClick={clearFilters}
              >
                Clear All
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={applyFilters}
              >
                Apply Filters
              </Button>
            </Flex>
          </Flex>
          
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4}>
            {/* Transaction Type */}
            <GridItem>
              <FormControl>
                <FormLabel>Transaction Type</FormLabel>
                <Select
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                >
                  {transactionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            
            {/* Source Type */}
            <GridItem>
              <FormControl>
                <FormLabel>Source Type</FormLabel>
                <Select
                  value={filters.sourceType}
                  onChange={(e) => setFilters({ ...filters, sourceType: e.target.value })}
                >
                  {sourceTypes.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            
            {/* Status */}
            <GridItem>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            
            {/* User Role */}
            <GridItem>
              <FormControl>
                <FormLabel>User Role</FormLabel>
                <Select
                  value={filters.userRole}
                  onChange={(e) => setFilters({ ...filters, userRole: e.target.value })}
                >
                  {userRoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>
            
            {/* Date Range */}
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl>
                <FormLabel>Date Range</FormLabel>
                <Flex gap={2}>
                  <Box flex={1}>
                    <DatePicker
                      selected={filters.startDate}
                      onChange={(date) => setFilters({ ...filters, startDate: date })}
                      selectsStart
                      startDate={filters.startDate}
                      endDate={filters.endDate}
                      placeholderText="Start Date"
                      className="chakra-input"
                      customInput={
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <CalendarIcon color="gray.400" />
                          </InputLeftElement>
                          <Input placeholder="Start Date" />
                        </InputGroup>
                      }
                    />
                  </Box>
                  <Box flex={1}>
                    <DatePicker
                      selected={filters.endDate}
                      onChange={(date) => setFilters({ ...filters, endDate: date })}
                      selectsEnd
                      startDate={filters.startDate}
                      endDate={filters.endDate}
                      minDate={filters.startDate}
                      placeholderText="End Date"
                      className="chakra-input"
                      customInput={
                        <InputGroup>
                          <InputLeftElement pointerEvents="none">
                            <CalendarIcon color="gray.400" />
                          </InputLeftElement>
                          <Input placeholder="End Date" />
                        </InputGroup>
                      }
                    />
                  </Box>
                </Flex>
              </FormControl>
            </GridItem>
            
            {/* Amount Range */}
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormControl>
                <FormLabel>Amount Range (GHS)</FormLabel>
                <Flex gap={2}>
                  <Input
                    placeholder="Min Amount"
                    value={filters.minAmount || ''}
                    onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                    type="number"
                  />
                  <Input
                    placeholder="Max Amount"
                    value={filters.maxAmount || ''}
                    onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                    type="number"
                  />
                </Flex>
              </FormControl>
            </GridItem>
          </Grid>
          
          {/* Active Filters Tags */}
          {Object.values(filters).some(f => f !== null && f !== 'all') && (
            <Box mt={4}>
              <Text fontWeight="medium" mb={2}>Active Filters:</Text>
              <HStack spacing={2} flexWrap="wrap">
                {filters.transactionType !== 'all' && (
                  <Tag size="sm" colorScheme="blue">
                    Type: {transactionTypes.find(t => t.value === filters.transactionType)?.label}
                  </Tag>
                )}
                {filters.sourceType !== 'all' && (
                  <Tag size="sm" colorScheme="green">
                    Source: {sourceTypes.find(s => s.value === filters.sourceType)?.label}
                  </Tag>
                )}
                {filters.status !== 'all' && (
                  <Tag size="sm" colorScheme="orange">
                    Status: {statusOptions.find(s => s.value === filters.status)?.label}
                  </Tag>
                )}
                {filters.userRole !== 'all' && (
                  <Tag size="sm" colorScheme="purple">
                    Role: {userRoleOptions.find(r => r.value === filters.userRole)?.label}
                  </Tag>
                )}
                {filters.startDate && (
                  <Tag size="sm" colorScheme="gray">
                    From: {filters.startDate.toLocaleDateString()}
                  </Tag>
                )}
                {filters.endDate && (
                  <Tag size="sm" colorScheme="gray">
                    To: {filters.endDate.toLocaleDateString()}
                  </Tag>
                )}
              </HStack>
            </Box>
          )}
        </Box>
      )}

      {/* Search Bar */}
      <Flex gap={4} mb={6}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search by reference, description, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </Flex>

      {/* Transactions Table */}
      <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : transactions.length === 0 ? (
          <Flex justify="center" align="center" minH="200px">
            <Text color="gray.500">No transactions found</Text>
          </Flex>
        ) : (
          <>
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Date & Time</Th>
                  <Th>User</Th>
                  <Th>Type</Th>
                  <Th>Source</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Reference</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((transaction) => (
                  <Tr key={transaction.id} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <Box>
                        <Text fontSize="sm">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </Text>
                      </Box>
                    </Td>
                    <Td>
                      <Box>
                        <Text fontWeight="medium">
                          {transaction.wallet?.user?.full_name || 'N/A'}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {transaction.wallet?.user?.email}
                        </Text>
                        <Badge
                          size="sm"
                          colorScheme={
                            transaction.wallet?.role === 'driver' ? 'blue' :
                            transaction.wallet?.role === 'passenger' ? 'green' :
                            transaction.wallet?.role === 'admin' ? 'purple' : 'gray'
                          }
                        >
                          {transaction.wallet?.role}
                        </Badge>
                      </Box>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          transaction.transaction_type === 'credit' ? 'green' :
                          transaction.transaction_type === 'debit' ? 'red' : 'gray'
                        }
                        variant="subtle"
                      >
                        {transaction.transaction_type.toUpperCase()}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{formatSourceType(transaction.source_type)}</Text>
                    </Td>
                    <Td>
                      <Text
                        fontWeight="bold"
                        color={
                          transaction.transaction_type === 'credit' ? 'green.600' :
                          transaction.transaction_type === 'debit' ? 'red.600' : 'gray.600'
                        }
                      >
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {transaction.currency}
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          transaction.status === 'completed' ? 'green' :
                          transaction.status === 'pending' ? 'yellow' :
                          transaction.status === 'failed' ? 'red' : 'gray'
                        }
                        variant="subtle"
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </Td>
                    <Td>
                      {transaction.external_reference ? (
                        <Text fontSize="sm" fontFamily="mono" color="gray.600">
                          {transaction.external_reference.slice(0, 20)}...
                        </Text>
                      ) : (
                        <Text fontSize="sm" color="gray.400">No reference</Text>
                      )}
                    </Td>
                    <Td>
                      <Tooltip label="View Details">
                        <IconButton
                          aria-label="View transaction details"
                          icon={<ViewIcon />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() => loadTransactionDetails(transaction.id)}
                        />
                      </Tooltip>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" p={4} borderTopWidth="1px">
                <Text color="gray.600">
                  Page {currentPage} of {totalPages}
                </Text>
                <Flex gap={2}>
                  <Button
                    leftIcon={<ChevronLeftIcon />}
                    size="sm"
                    isDisabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => prev - 1);
                      loadTransactions(currentPage - 1);
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    rightIcon={<ChevronRightIcon />}
                    size="sm"
                    isDisabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => prev + 1);
                      loadTransactions(currentPage + 1);
                    }}
                  >
                    Next
                  </Button>
                </Flex>
              </Flex>
            )}
          </>
        )}
      </Box>

      {/* Transaction Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {transactionDetails && (
              <>
                <SimpleGrid columns={2} spacing={6} mb={6}>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Transaction Information</Text>
                    <Text><strong>ID:</strong> {transactionDetails.id}</Text>
                    <Text><strong>Type:</strong> {transactionDetails.transaction_type.toUpperCase()}</Text>
                    <Text><strong>Source:</strong> {formatSourceType(transactionDetails.source_type)}</Text>
                    <Text><strong>Status:</strong> {transactionDetails.status}</Text>
                    <Text><strong>Created:</strong> {new Date(transactionDetails.created_at).toLocaleString()}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Amount Details</Text>
                    <Text><strong>Amount:</strong> {formatCurrency(transactionDetails.amount)}</Text>
                    <Text><strong>Currency:</strong> {transactionDetails.currency}</Text>
                    <Text><strong>Balance Before:</strong> {formatCurrency(transactionDetails.balance_before)}</Text>
                    <Text><strong>Balance After:</strong> {formatCurrency(transactionDetails.balance_after)}</Text>
                  </Box>
                </SimpleGrid>
                
                <Box mb={6}>
                  <Text fontWeight="bold" mb={2}>User Information</Text>
                  <Text><strong>Name:</strong> {transactionDetails.wallet?.user?.full_name || 'N/A'}</Text>
                  <Text><strong>Email:</strong> {transactionDetails.wallet?.user?.email}</Text>
                  <Text><strong>Role:</strong> {transactionDetails.wallet?.role}</Text>
                  <Text><strong>User ID:</strong> {transactionDetails.wallet?.user_id}</Text>
                </Box>
                
                {transactionDetails.external_reference && (
                  <Box mb={6}>
                    <Text fontWeight="bold" mb={2}>External Reference</Text>
                    <Text fontFamily="mono" bg="gray.50" p={2} borderRadius="md">
                      {transactionDetails.external_reference}
                    </Text>
                  </Box>
                )}
                
                {transactionDetails.description && (
                  <Box mb={6}>
                    <Text fontWeight="bold" mb={2}>Description</Text>
                    <Text>{transactionDetails.description}</Text>
                  </Box>
                )}
                
                {transactionDetails.metadata && Object.keys(transactionDetails.metadata).length > 0 && (
                  <Box mb={6}>
                    <Text fontWeight="bold" mb={2}>Metadata</Text>
                    <Box bg="gray.50" p={3} borderRadius="md" maxH="200px" overflowY="auto">
                      <pre style={{ margin: 0, fontSize: '12px' }}>
                        {JSON.stringify(transactionDetails.metadata, null, 2)}
                      </pre>
                    </Box>
                  </Box>
                )}
                
                {transactionDetails.paystack_transaction && (
                  <Box mb={6}>
                    <Text fontWeight="bold" mb={2}>Paystack Details</Text>
                    <Text><strong>Reference:</strong> {transactionDetails.paystack_transaction.paystack_reference}</Text>
                    <Text><strong>Status:</strong> {transactionDetails.paystack_transaction.paystack_status}</Text>
                    {transactionDetails.paystack_transaction.amount && (
                      <Text><strong>Amount:</strong> {formatCurrency(transactionDetails.paystack_transaction.amount)}</Text>
                    )}
                    {transactionDetails.paystack_transaction.created_at && (
                      <Text><strong>Created:</strong> {new Date(transactionDetails.paystack_transaction.created_at).toLocaleString()}</Text>
                    )}
                  </Box>
                )}
                
                {transactionDetails.payout && (
                  <Box mb={6}>
                    <Text fontWeight="bold" mb={2}>Payout Details</Text>
                    <Text><strong>Requested Amount:</strong> {formatCurrency(transactionDetails.payout.requested_amount)}</Text>
                    <Text><strong>Net Amount:</strong> {formatCurrency(transactionDetails.payout.net_amount)}</Text>
                    <Text><strong>Status:</strong> {transactionDetails.payout.status}</Text>
                  </Box>
                )}
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={onDetailsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Transactions;