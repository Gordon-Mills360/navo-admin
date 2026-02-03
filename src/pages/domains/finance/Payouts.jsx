import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  IconButton,
  Badge,
  HStack,
  VStack,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  useToast,
  useDisclosure,
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
  Avatar,
  Divider,
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
  Checkbox,
  CheckboxGroup,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import {
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  RepeatIcon,
  TimeIcon,
  CalendarIcon,
  ChevronRightIcon,
  SearchIcon,
  FilterIcon,
  AttachmentIcon,
  EyeIcon,
  CheckCircleIcon,
} from '@chakra-ui/icons';
import { FaMoneyBillWave, FaWallet, FaFileExport, FaPrint } from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import useFinance from '../../../hooks/useFinance';
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

const Payouts = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const { getPayouts, processPayout, getPayoutStats } = useFinance();
  
  const toast = useToast();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPayouts, setSelectedPayouts] = useState([]);
  const [bulkAction, setBulkAction] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isBulkOpen, 
    onOpen: onBulkOpen, 
    onClose: onBulkClose 
  } = useDisclosure();
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });
  const [selectedPayout, setSelectedPayout] = useState(null);

  // Fetch payouts data
  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getPayouts(filters);
      
      if (fetchError) throw fetchError;
      
      setPayouts(data || []);
      
      // Fetch stats
      const { data: statsData } = await getPayoutStats();
      setStats(statsData);
      
    } catch (err) {
      console.error('Error fetching payouts:', err);
      setError('Failed to load payouts data');
      toast({
        title: 'Error',
        description: 'Failed to load payouts data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getPayouts, getPayoutStats, filters, toast]);

  // Initial fetch
  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  // Handle payout status change
  const handlePayoutAction = async (payoutId, action) => {
    setActionLoading(true);
    try {
      const { error } = await processPayout(payoutId, action);
      
      if (error) throw error;
      
      const actionText = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'processed';
      
      toast({
        title: `Payout ${actionText}`,
        description: `Payout has been ${actionText} successfully`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh data
      fetchPayouts();
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: `${action}_payout`,
        resource_type: 'payout',
        resource_id: payoutId,
        details: { action },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to process payout',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bulk action
  const handleBulkAction = async () => {
    if (selectedPayouts.length === 0) {
      toast({
        title: 'No payouts selected',
        description: 'Please select payouts to perform bulk action',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    setActionLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const payoutId of selectedPayouts) {
        try {
          const { error } = await processPayout(payoutId, bulkAction);
          if (!error) successCount++;
          else errorCount++;
        } catch (err) {
          errorCount++;
        }
      }
      
      toast({
        title: 'Bulk action completed',
        description: `${successCount} payouts processed successfully, ${errorCount} failed`,
        status: successCount > 0 ? 'success' : 'error',
        duration: 5000,
      });
      
      // Refresh data
      fetchPayouts();
      setSelectedPayouts([]);
      onBulkClose();
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: `bulk_${bulkAction}_payouts`,
        resource_type: 'payout',
        details: { 
          count: selectedPayouts.length,
          action: bulkAction,
          success: successCount,
          failed: errorCount
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to process bulk action',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle payout selection
  const handleSelectPayout = (payoutId) => {
    setSelectedPayouts(prev => {
      if (prev.includes(payoutId)) {
        return prev.filter(id => id !== payoutId);
      } else {
        return [...prev, payoutId];
      }
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedPayouts.length === payouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(payouts.map(p => p.id));
    }
  };

  // Handle view details
  const handleViewDetails = (payout) => {
    setSelectedPayout(payout);
    onDetailOpen();
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle export
  const handleExport = (format) => {
    toast({
      title: `Exporting to ${format.toUpperCase()}`,
      description: `Payout data will be exported in ${format} format`,
      status: 'info',
      duration: 3000,
    });
  };

  // Calculate total selected amount
  const totalSelectedAmount = selectedPayouts.reduce((total, payoutId) => {
    const payout = payouts.find(p => p.id === payoutId);
    return total + (payout?.amount || 0);
  }, 0);

  // Table columns configuration
  const columns = [
    {
      header: (
        <Checkbox
          isChecked={selectedPayouts.length === payouts.length && payouts.length > 0}
          isIndeterminate={selectedPayouts.length > 0 && selectedPayouts.length < payouts.length}
          onChange={handleSelectAll}
        />
      ),
      accessor: 'select',
      cell: (row) => (
        <Checkbox
          isChecked={selectedPayouts.includes(row.id)}
          onChange={() => handleSelectPayout(row.id)}
        />
      ),
      width: '50px',
    },
    {
      header: 'Payout ID',
      accessor: 'payout_code',
      cell: (row) => (
        <Text fontWeight="medium" fontFamily="mono">
          #{row.payout_code}
        </Text>
      ),
    },
    {
      header: 'Driver',
      accessor: 'driver',
      cell: (row) => (
        <HStack>
          <Avatar
            size="sm"
            name={row.driver_name}
            src={row.driver_profile_picture}
          />
          <Box>
            <Text fontWeight="medium">{row.driver_name}</Text>
            <Text fontSize="xs" color="gray.500">
              {row.driver_id}
            </Text>
          </Box>
        </HStack>
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      cell: (row) => (
        <Text fontWeight="bold" color="green.600">
          ${row.amount?.toFixed(2)}
        </Text>
      ),
    },
    {
      header: 'Method',
      accessor: 'payout_method',
      cell: (row) => (
        <Badge colorScheme="blue" textTransform="uppercase">
          {row.payout_method}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        let colorScheme = 'gray';
        let icon = <TimeIcon />;
        
        switch(row.status) {
          case 'pending':
            colorScheme = 'yellow';
            icon = <TimeIcon />;
            break;
          case 'approved':
            colorScheme = 'blue';
            icon = <CheckIcon />;
            break;
          case 'processing':
            colorScheme = 'purple';
            icon = <RepeatIcon />;
            break;
          case 'completed':
            colorScheme = 'green';
            icon = <CheckCircleIcon />;
            break;
          case 'failed':
            colorScheme = 'red';
            icon = <CloseIcon />;
            break;
          case 'rejected':
            colorScheme = 'red';
            icon = <CloseIcon />;
            break;
        }
        
        return (
          <Badge colorScheme={colorScheme} display="flex" alignItems="center" gap={1} w="fit-content">
            {icon}
            {row.status}
          </Badge>
        );
      },
    },
    {
      header: 'Request Date',
      accessor: 'requested_at',
      cell: (row) => (
        <VStack align="start" spacing={0}>
          <Text fontSize="sm">{new Date(row.requested_at).toLocaleDateString()}</Text>
          <Text fontSize="xs" color="gray.500">
            {new Date(row.requested_at).toLocaleTimeString()}
          </Text>
        </VStack>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <HStack spacing={1}>
          <Tooltip label="View Details">
            <IconButton
              icon={<EyeIcon />}
              size="sm"
              variant="ghost"
              onClick={() => handleViewDetails(row)}
            />
          </Tooltip>
          {row.status === 'pending' && hasPermission('payout', 'approve') && (
            <Tooltip label="Approve">
              <IconButton
                icon={<CheckIcon />}
                size="sm"
                colorScheme="green"
                variant="ghost"
                onClick={() => handlePayoutAction(row.id, 'approve')}
                isLoading={actionLoading}
              />
            </Tooltip>
          )}
          {row.status === 'pending' && hasPermission('payout', 'reject') && (
            <Tooltip label="Reject">
              <IconButton
                icon={<CloseIcon />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => handlePayoutAction(row.id, 'reject')}
                isLoading={actionLoading}
              />
            </Tooltip>
          )}
        </HStack>
      ),
    },
  ];

  // Stats cards
  const renderStatsCards = () => (
    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Pending Payouts</StatLabel>
            <StatNumber color="yellow.600">
              ${stats?.pending_amount?.toFixed(2) || '0.00'}
            </StatNumber>
            <StatHelpText>
              {stats?.pending_count || 0} requests
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Processing</StatLabel>
            <StatNumber color="blue.600">
              ${stats?.processing_amount?.toFixed(2) || '0.00'}
            </StatNumber>
            <StatHelpText>
              {stats?.processing_count || 0} in queue
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Completed Today</StatLabel>
            <StatNumber color="green.600">
              ${stats?.today_amount?.toFixed(2) || '0.00'}
            </StatNumber>
            <StatHelpText>
              {stats?.today_count || 0} payouts
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Total This Month</StatLabel>
            <StatNumber>
              ${stats?.month_amount?.toFixed(2) || '0.00'}
            </StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              18% from last month
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  if (loading && payouts.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading payouts data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load payouts</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchPayouts} leftIcon={<RepeatIcon />}>
            Retry
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg">Driver Payouts</Heading>
          <Text color="gray.600" mt={1}>
            Manage driver payout requests and processing
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchPayouts}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
          <Button
            leftIcon={<FaFileExport />}
            colorScheme="blue"
            onClick={() => handleExport('csv')}
          >
            Export
          </Button>
        </HStack>
      </Flex>

      {renderStatsCards()}

      {/* Bulk Actions Bar */}
      {selectedPayouts.length > 0 && (
        <Card bg="blue.50" borderColor="blue.200" mb={6}>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Box>
                <Text fontWeight="bold">
                  {selectedPayouts.length} payouts selected
                </Text>
                <Text color="gray.600">
                  Total amount: ${totalSelectedAmount.toFixed(2)}
                </Text>
              </Box>
              <HStack spacing={3}>
                <Select
                  placeholder="Select action"
                  value={bulkAction || ''}
                  onChange={(e) => setBulkAction(e.target.value)}
                  width="200px"
                >
                  <option value="approve">Approve Selected</option>
                  <option value="reject">Reject Selected</option>
                  <option value="process">Process Selected</option>
                </Select>
                <Button
                  colorScheme="blue"
                  onClick={onBulkOpen}
                  isDisabled={!bulkAction}
                >
                  Apply
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPayouts([])}
                >
                  Clear
                </Button>
              </HStack>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Status</FormLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                size="sm"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="rejected">Rejected</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Date From</FormLabel>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                size="sm"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Date To</FormLabel>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                size="sm"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Amount Range</FormLabel>
              <HStack>
                <Input
                  placeholder="Min"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  size="sm"
                />
                <Text>to</Text>
                <Input
                  placeholder="Max"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  size="sm"
                />
              </HStack>
            </FormControl>
          </SimpleGrid>
          <Flex justify="flex-end" mt={4}>
            <Button
              size="sm"
              onClick={() => setFilters({
                status: 'all',
                dateFrom: '',
                dateTo: '',
                minAmount: '',
                maxAmount: '',
              })}
              variant="ghost"
            >
              Clear Filters
            </Button>
          </Flex>
        </CardBody>
      </Card>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Pending ({stats?.pending_count || 0})</Tab>
          <Tab>Processing ({stats?.processing_count || 0})</Tab>
          <Tab>Completed ({stats?.completed_count || 0})</Tab>
          <Tab>All Payouts ({payouts.length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={payouts.filter(p => p.status === 'pending')}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={payouts.filter(p => p.status === 'processing' || p.status === 'approved')}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={payouts.filter(p => p.status === 'completed')}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={payouts}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Payout Details Modal */}
      {selectedPayout && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <FaMoneyBillWave />
                <Text>Payout #{selectedPayout.payout_code}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                {/* Status Banner */}
                <Alert 
                  status={
                    selectedPayout.status === 'completed' ? 'success' :
                    selectedPayout.status === 'pending' ? 'warning' :
                    selectedPayout.status === 'failed' || selectedPayout.status === 'rejected' ? 'error' : 'info'
                  }
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle textTransform="capitalize">
                      {selectedPayout.status}
                    </AlertTitle>
                    <AlertDescription>
                      {selectedPayout.status_message || 'No additional information'}
                    </AlertDescription>
                  </Box>
                </Alert>

                {/* Payout Details */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      Amount
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      ${selectedPayout.amount?.toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      Payout Method
                    </Text>
                    <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                      {selectedPayout.payout_method}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      Requested Date
                    </Text>
                    <Text>
                      {new Date(selectedPayout.requested_at).toLocaleString()}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                      Processed Date
                    </Text>
                    <Text>
                      {selectedPayout.processed_at 
                        ? new Date(selectedPayout.processed_at).toLocaleString()
                        : 'Not processed yet'
                      }
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Driver Information */}
                <Box>
                  <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                    Driver Information
                  </Text>
                  <Card variant="outline">
                    <CardBody>
                      <HStack spacing={4}>
                        <Avatar
                          size="lg"
                          name={selectedPayout.driver_name}
                          src={selectedPayout.driver_profile_picture}
                        />
                        <Box>
                          <Text fontWeight="bold">{selectedPayout.driver_name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            ID: {selectedPayout.driver_id}
                          </Text>
                          <Text fontSize="sm">Email: {selectedPayout.driver_email}</Text>
                          <Text fontSize="sm">Phone: {selectedPayout.driver_phone}</Text>
                        </Box>
                      </HStack>
                    </CardBody>
                  </Card>
                </Box>

                {/* Payout Method Details */}
                <Box>
                  <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                    Payout Method Details
                  </Text>
                  <Card variant="outline">
                    <CardBody>
                      {selectedPayout.payout_method === 'bank_transfer' && (
                        <SimpleGrid columns={2} spacing={3}>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Bank Name</Text>
                            <Text fontWeight="medium">{selectedPayout.bank_name}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Account Number</Text>
                            <Text fontFamily="mono">****{selectedPayout.account_last_four}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Account Holder</Text>
                            <Text>{selectedPayout.account_holder_name}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Routing Number</Text>
                            <Text fontFamily="mono">*****{selectedPayout.routing_last_four}</Text>
                          </Box>
                        </SimpleGrid>
                      )}
                      
                      {selectedPayout.payout_method === 'paypal' && (
                        <Box>
                          <Text fontSize="sm" color="gray.600">PayPal Email</Text>
                          <Text fontWeight="medium">{selectedPayout.paypal_email}</Text>
                        </Box>
                      )}
                      
                      {selectedPayout.payout_method === 'cash' && (
                        <Box>
                          <Text fontSize="sm" color="gray.600">Cash Pickup Location</Text>
                          <Text fontWeight="medium">{selectedPayout.cash_location}</Text>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                </Box>

                {/* Transaction History */}
                <Box>
                  <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                    Related Transactions
                  </Text>
                  <Card variant="outline">
                    <CardBody>
                      {selectedPayout.transactions?.length > 0 ? (
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Trip ID</Th>
                              <Th>Date</Th>
                              <Th isNumeric>Earnings</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {selectedPayout.transactions.slice(0, 5).map((tx, idx) => (
                              <Tr key={idx}>
                                <Td>#{tx.trip_code}</Td>
                                <Td>{new Date(tx.created_at).toLocaleDateString()}</Td>
                                <Td isNumeric>
                                  <Text color="green.600">${tx.amount?.toFixed(2)}</Text>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      ) : (
                        <Text color="gray.500" textAlign="center" py={2}>
                          No transaction details available
                        </Text>
                      )}
                    </CardBody>
                  </Card>
                </Box>

                {/* Notes */}
                {selectedPayout.notes && (
                  <Box>
                    <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                      Admin Notes
                    </Text>
                    <Card variant="outline">
                      <CardBody>
                        <Text whiteSpace="pre-wrap">{selectedPayout.notes}</Text>
                      </CardBody>
                    </Card>
                  </Box>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDetailClose}>
                Close
              </Button>
              {selectedPayout.status === 'pending' && (
                <HStack>
                  {hasPermission('payout', 'approve') && (
                    <Button
                      colorScheme="green"
                      onClick={() => {
                        handlePayoutAction(selectedPayout.id, 'approve');
                        onDetailClose();
                      }}
                      isLoading={actionLoading}
                    >
                      Approve
                    </Button>
                  )}
                  {hasPermission('payout', 'reject') && (
                    <Button
                      colorScheme="red"
                      onClick={() => {
                        handlePayoutAction(selectedPayout.id, 'reject');
                        onDetailClose();
                      }}
                      isLoading={actionLoading}
                    >
                      Reject
                    </Button>
                  )}
                </HStack>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Bulk Action Confirmation Modal */}
      <ConfirmationModal
        isOpen={isBulkOpen}
        onClose={onBulkClose}
        onConfirm={handleBulkAction}
        title={`Bulk ${bulkAction} Payouts`}
        message={`Are you sure you want to ${bulkAction} ${selectedPayouts.length} payouts? This action cannot be undone.`}
        type="warning"
        isLoading={actionLoading}
      />
    </Box>
  );
};

export default Payouts;