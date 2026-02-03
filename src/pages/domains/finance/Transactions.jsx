import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Flex,
  useColorModeValue,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaFilter,
  FaDollarSign,
  FaCreditCard,
  FaExchangeAlt,
  FaWallet,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEye,
  FaUndo,
  FaDownload,
  FaEllipsisV,
  FaCalendarAlt,
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../services/supabase';
import Layout from '../../../components/layout/Layout';

const Transactions = () => {
  const { admin } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isRefundOpen, onOpen: onRefundOpen, onClose: onRefundClose } = useDisclosure();
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
          *,
          wallet:wallets (
            owner_id,
            owner_type,
            user:profiles!wallets_owner_id_fkey (full_name, email)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      
      setTransactions(data || []);
      setFilteredTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    
    const subscription = supabase
      .channel('transactions_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions' }, fetchTransactions)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    let filtered = transactions;
    
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.wallet?.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.wallet?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.transaction_type === typeFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    // Date range filtering
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(t => new Date(t.created_at) >= startDate);
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, typeFilter, statusFilter, dateRange]);

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    onOpen();
  };

  const handleRefund = (transaction) => {
    setSelectedTransaction(transaction);
    setRefundAmount(transaction.amount);
    onRefundOpen();
  };

  const confirmRefund = async () => {
    if (!refundReason || refundAmount <= 0) {
      alert('Please enter refund reason and amount');
      return;
    }

    try {
      // Create refund transaction
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: selectedTransaction.wallet_id,
          transaction_type: 'refund',
          amount: -refundAmount,
          balance_before: selectedTransaction.balance_after,
          balance_after: selectedTransaction.balance_after - refundAmount,
          reference_id: selectedTransaction.id,
          reference_type: 'refund',
          description: `Refund: ${refundReason}`,
          status: 'completed',
          processed_by: admin.id,
        });

      if (error) throw error;

      // Update wallet balance
      await supabase
        .from('wallets')
        .update({
          balance: selectedTransaction.balance_after - refundAmount,
          available_balance: selectedTransaction.balance_after - refundAmount,
        })
        .eq('id', selectedTransaction.wallet_id);

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: admin.id,
        admin_email: admin.email,
        admin_role: admin.role,
        action: 'PROCESS_REFUND',
        resource_type: 'transactions',
        resource_id: selectedTransaction.id,
        details: JSON.stringify({
          amount: refundAmount,
          reason: refundReason,
          original_transaction: selectedTransaction.id,
        }),
      });

      alert('Refund processed successfully');
      setRefundAmount(0);
      setRefundReason('');
      onRefundClose();
      fetchTransactions();
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'ride_payment':
      case 'bonus':
        return 'green';
      case 'refund':
      case 'penalty':
        return 'red';
      case 'ride_commission':
      case 'payout':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'pending': return 'orange';
      case 'processing': return 'blue';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = {
    total: transactions.length,
    totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    completed: transactions.filter(t => t.status === 'completed').length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
  };

  const transactionTypes = [
    { type: 'ride_payment', label: 'Ride Payments', icon: FaDollarSign },
    { type: 'ride_commission', label: 'Commissions', icon: FaCreditCard },
    { type: 'refund', label: 'Refunds', icon: FaUndo },
    { type: 'payout', label: 'Payouts', icon: FaWallet },
    { type: 'bonus', label: 'Bonuses', icon: FaExchangeAlt },
    { type: 'penalty', label: 'Penalties', icon: FaTimesCircle },
  ];

  const columns = [
    {
      key: 'id',
      header: 'Transaction ID',
      render: (value) => (
        <Text fontFamily="mono" fontSize="xs" color="gray.500">
          {value.slice(0, 8)}...
        </Text>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (value, transaction) => (
        <Box>
          <Text fontSize="sm" fontWeight="medium">
            {transaction.wallet?.user?.full_name || 'Unknown'}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {transaction.wallet?.owner_type}
          </Text>
        </Box>
      ),
    },
    {
      key: 'transaction_type',
      header: 'Type',
      render: (value) => (
        <Badge
          colorScheme={getTypeColor(value)}
          variant="subtle"
          fontSize="xs"
          px={3}
          py={1}
        >
          {value.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (value, transaction) => (
        <Text
          fontSize="sm"
          fontWeight="bold"
          color={transaction.transaction_type === 'refund' || transaction.transaction_type === 'penalty' ? 'red.600' : 'green.600'}
        >
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge
          colorScheme={getStatusColor(value)}
          variant="subtle"
          fontSize="xs"
          px={3}
          py={1}
        >
          {value}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Date',
      render: (value) => (
        <Text fontSize="sm">
          {formatDate(value)}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value, transaction) => (
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            size="sm"
            variant="ghost"
          />
          <MenuList minW="180px">
            <MenuItem
              icon={<FaEye />}
              onClick={() => handleViewTransaction(transaction)}
            >
              View Details
            </MenuItem>
            {transaction.transaction_type === 'ride_payment' && transaction.status === 'completed' && (
              <MenuItem
                icon={<FaUndo />}
                colorScheme="orange"
                onClick={() => handleRefund(transaction)}
              >
                Process Refund
              </MenuItem>
            )}
            <MenuItem
              icon={<FaDownload />}
              onClick={() => alert(`Downloading transaction ${transaction.id}`)}
            >
              Download Receipt
            </MenuItem>
            {transaction.status === 'failed' && (
              <MenuItem
                icon={<FaCheckCircle />}
                colorScheme="green"
                onClick={() => alert(`Retry transaction ${transaction.id}`)}
              >
                Retry Transaction
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      ),
    },
  ];

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Transaction Management
            </Heading>
            <Text color="gray.600" mt={1}>
              Monitor and manage all financial transactions
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FaDownload />}
              colorScheme="brand"
              size="sm"
              onClick={() => alert('Exporting transaction data...')}
            >
              Export Data
            </Button>
            <Button
              leftIcon={<FaCalendarAlt />}
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/finance/reports'}
            >
              Generate Report
            </Button>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4}>
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                {stats.total}
              </Text>
              <Text fontSize="sm" color="gray.600">Total Transactions</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {formatCurrency(stats.totalAmount)}
              </Text>
              <Text fontSize="sm" color="gray.600">Total Amount</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {stats.completed}
              </Text>
              <Text fontSize="sm" color="gray.600">Completed</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                {stats.pending}
              </Text>
              <Text fontSize="sm" color="gray.600">Pending</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="red.600">
                {stats.failed}
              </Text>
              <Text fontSize="sm" color="gray.600">Failed</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Transaction Type Breakdown */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Transaction Type Overview</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {transactionTypes.map((type) => {
                const Icon = type.icon;
                const typeTransactions = transactions.filter(t => t.transaction_type === type.type);
                const totalAmount = typeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                
                return (
                  <Box
                    key={type.type}
                    p={4}
                    borderWidth="1px"
                    borderColor="gray.200"
                    borderRadius="lg"
                  >
                    <HStack justify="space-between" mb={3}>
                      <HStack spacing={3}>
                        <Box
                          w={10}
                          h={10}
                          borderRadius="lg"
                          bg={`${getTypeColor(type.type)}.100`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon color={`${getTypeColor(type.type)}.600`} />
                        </Box>
                        <Box>
                          <Text fontWeight="medium">{type.label}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {typeTransactions.length} transactions
                          </Text>
                        </Box>
                      </HStack>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold">
                      {formatCurrency(totalAmount)}
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Filters */}
        <Flex gap={4} wrap="wrap">
          <InputGroup flex={1} minW="300px">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search transactions by ID, user name, email, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="lg"
            />
          </InputGroup>
          
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            width="150px"
            borderRadius="lg"
          >
            <option value="all">All Types</option>
            <option value="ride_payment">Ride Payments</option>
            <option value="ride_commission">Commissions</option>
            <option value="refund">Refunds</option>
            <option value="payout">Payouts</option>
            <option value="bonus">Bonuses</option>
            <option value="penalty">Penalties</option>
          </Select>
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            width="150px"
            borderRadius="lg"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </Select>
          
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            width="150px"
            borderRadius="lg"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </Select>
          
          <Button
            leftIcon={<FaFilter />}
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('all');
              setStatusFilter('all');
              setDateRange('all');
            }}
          >
            Clear Filters
          </Button>
        </Flex>

        {/* Failed Transactions Alert */}
        {stats.failed > 0 && (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>{stats.failed} Failed Transactions</AlertTitle>
              <AlertDescription>
                These transactions require attention and possibly retry
              </AlertDescription>
            </Box>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              onClick={() => setStatusFilter('failed')}
            >
              View Failed
            </Button>
          </Alert>
        )}

        {/* Transactions Table */}
        <Box
          bg={cardBg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <Box overflowX="auto">
            <Table variant="simple" size="md">
              <Thead>
                <Tr>
                  {columns.map((column) => (
                    <Th key={column.key}>{column.header}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={columns.length} textAlign="center" py={10}>
                      <Text color="gray.500">Loading transactions...</Text>
                    </Td>
                  </Tr>
                ) : filteredTransactions.length === 0 ? (
                  <Tr>
                    <Td colSpan={columns.length} textAlign="center" py={10}>
                      <Text color="gray.500">No transactions found matching your filters</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <Tr key={transaction.id} _hover={{ bg: 'gray.50' }}>
                      {columns.map((column) => (
                        <Td key={column.key}>
                          {column.render ? column.render(transaction[column.key], transaction) : transaction[column.key]}
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </VStack>

      {/* Transaction Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTransaction && (
              <VStack spacing={6} align="stretch">
                {/* Transaction Header */}
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="md">Transaction #{selectedTransaction.id.slice(0, 8)}</Heading>
                    <Text color="gray.600">
                      {formatDate(selectedTransaction.created_at)}
                    </Text>
                  </Box>
                  <HStack spacing={3}>
                    <Badge
                      colorScheme={getTypeColor(selectedTransaction.transaction_type)}
                      variant="subtle"
                      fontSize="sm"
                      px={3}
                      py={1}
                    >
                      {selectedTransaction.transaction_type.replace('_', ' ')}
                    </Badge>
                    <Badge
                      colorScheme={getStatusColor(selectedTransaction.status)}
                      variant="subtle"
                      fontSize="sm"
                      px={3}
                      py={1}
                    >
                      {selectedTransaction.status}
                    </Badge>
                  </HStack>
                </Flex>

                {/* Amount Display */}
                <Box
                  p={6}
                  bg="gray.50"
                  borderRadius="lg"
                  textAlign="center"
                >
                  <Text fontSize="xs" color="gray.600" mb={2}>
                    Transaction Amount
                  </Text>
                  <Text
                    fontSize="3xl"
                    fontWeight="bold"
                    color={selectedTransaction.transaction_type === 'refund' ? 'red.600' : 'green.600'}
                  >
                    {formatCurrency(selectedTransaction.amount)}
                  </Text>
                </Box>

                {/* Transaction Details */}
                <SimpleGrid columns={2} spacing={6}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      User
                    </Text>
                    <Text fontWeight="medium">
                      {selectedTransaction.wallet?.user?.full_name || 'Unknown'}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {selectedTransaction.wallet?.user?.email}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Wallet Type
                    </Text>
                    <Text fontWeight="medium">
                      {selectedTransaction.wallet?.owner_type}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Balance Before
                    </Text>
                    <Text fontWeight="medium">
                      {formatCurrency(selectedTransaction.balance_before)}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Balance After
                    </Text>
                    <Text fontWeight="medium">
                      {formatCurrency(selectedTransaction.balance_after)}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Reference ID
                    </Text>
                    <Text fontFamily="mono" fontSize="sm">
                      {selectedTransaction.reference_id || 'N/A'}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Processed By
                    </Text>
                    <Text fontWeight="medium">
                      {selectedTransaction.processed_by ? `Admin ${selectedTransaction.processed_by.slice(0, 8)}` : 'System'}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Description */}
                {selectedTransaction.description && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Description
                    </Text>
                    <Text p={3} bg="gray.50" borderRadius="lg">
                      {selectedTransaction.description}
                    </Text>
                  </Box>
                )}

                {/* Metadata */}
                {selectedTransaction.metadata && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Additional Data
                    </Text>
                    <Box
                      p={3}
                      bg="gray.50"
                      borderRadius="lg"
                      fontFamily="mono"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                    >
                      {JSON.stringify(selectedTransaction.metadata, null, 2)}
                    </Box>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedTransaction?.transaction_type === 'ride_payment' && selectedTransaction?.status === 'completed' && (
              <Button
                leftIcon={<FaUndo />}
                colorScheme="orange"
                mr={3}
                onClick={() => {
                  onClose();
                  handleRefund(selectedTransaction);
                }}
              >
                Process Refund
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Refund Modal */}
      <Modal isOpen={isRefundOpen} onClose={onRefundClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Process Refund</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTransaction && (
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle>Refund Information</AlertTitle>
                    <AlertDescription>
                      Original transaction: {selectedTransaction.id.slice(0, 8)}
                      <br />
                      Amount: {formatCurrency(selectedTransaction.amount)}
                    </AlertDescription>
                  </Box>
                </Alert>

                <FormControl>
                  <FormLabel>Refund Amount</FormLabel>
                  <NumberInput
                    min={0}
                    max={selectedTransaction.amount}
                    value={refundAmount}
                    onChange={(value) => setRefundAmount(parseFloat(value) || 0)}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Refund Reason</FormLabel>
                  <Textarea
                    placeholder="Enter reason for refund..."
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    minH="100px"
                    required
                  />
                </FormControl>

                <Alert status="warning">
                  <AlertIcon />
                  <Box flex="1">
                    <AlertTitle>Important</AlertTitle>
                    <AlertDescription>
                      This refund will be deducted from the user's wallet balance.
                      Ensure the reason is properly documented.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRefundClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmRefund}
              isDisabled={!refundReason || refundAmount <= 0}
            >
              Process Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default Transactions;