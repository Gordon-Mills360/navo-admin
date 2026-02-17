import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  useToast,
  useColorModeValue,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  CalendarIcon,
  RepeatIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  EyeIcon,
  DollarIcon,
  TimeIcon,
  LocationIcon
} from '@chakra-ui/icons';
import { FaCar, FaUser, FaUserTie, FaStar } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import useTripManagement from '../../../hooks/useTripManagement';
import DataTable from '../../../components/shared/DataTable';
import StatusBadge from '../../../components/shared/StatusBadge';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import { formatCurrency, formatDate, formatDuration, formatDistance } from '../../../utils/formatters';

const TripHistory = () => {
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    vehicle_type: '',
    date_range: '7d',
    search: '',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const {
    trips,
    loading,
    error,
    pagination,
    fetchTrips,
    cancelTrip,
    processRefund,
    getTripStatistics,
    exportTrips
  } = useTripManagement(filters);

  // Fetch trips on filter change
  useEffect(() => {
    fetchTrips();
  }, [filters, fetchTrips]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle search
  const handleSearch = (value) => {
    handleFilterChange('search', value);
  };

  // Handle date range change
  const handleDateRangeChange = (range) => {
    let startDate = new Date();
    
    switch (range) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }
    
    handleFilterChange('date_range', range);
    // Note: In a real implementation, you'd also update start_date filter
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    handleFilterChange('page', newPage);
  };

  // Handle refund
  const handleRefund = async () => {
    if (!selectedTrip || !refundAmount || !refundReason) {
      toast({
        title: 'Invalid input',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (parseFloat(refundAmount) > selectedTrip.total_amount) {
      toast({
        title: 'Invalid amount',
        description: 'Refund amount cannot exceed trip total',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await processRefund(selectedTrip.id, parseFloat(refundAmount), refundReason, user.id);
      
      toast({
        title: 'Refund processed',
        description: 'Refund has been processed successfully',
        status: 'success',
        duration: 3000,
      });
      
      setIsRefundModalOpen(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedTrip(null);
      
      // Refresh trips
      fetchTrips();
    } catch (error) {
      toast({
        title: 'Refund failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Export trips
  const handleExport = async (format) => {
    try {
      setExportLoading(true);
      await exportTrips(format, filters);
      
      toast({
        title: 'Export successful',
        description: `Trips exported as ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setExportLoading(false);
    }
  };

  // Calculate statistics from current trips
  const calculateStats = () => {
    if (!trips || trips.length === 0) {
      return {
        totalTrips: 0,
        totalRevenue: 0,
        averageRating: 0,
        completedTrips: 0,
        cancelledTrips: 0
      };
    }

    const completed = trips.filter(t => t.status === 'completed');
    const cancelled = trips.filter(t => t.status === 'cancelled');
    
    const totalRevenue = completed.reduce((sum, trip) => sum + trip.total_amount, 0);
    const averageRating = trips.reduce((sum, trip) => sum + (trip.rating || 0), 0) / trips.length;

    return {
      totalTrips: trips.length,
      totalRevenue,
      averageRating: averageRating.toFixed(1),
      completedTrips: completed.length,
      cancelledTrips: cancelled.length,
      completionRate: ((completed.length / trips.length) * 100).toFixed(1)
    };
  };

  const stats = calculateStats();

  // Table columns
  const columns = [
    {
      header: 'Trip ID',
      accessor: 'id',
      cell: (value, row) => (
        <Tooltip label="View trip details">
          <Button
            as={RouterLink}
            to={`/operations/trips/${row.id}`}
            variant="link"
            color="blue.500"
            size="sm"
            rightIcon={<ExternalLinkIcon />}
          >
            {value.substring(0, 8)}...
          </Button>
        </Tooltip>
      )
    },
    {
      header: 'Passenger',
      accessor: 'passenger_name',
      cell: (value, row) => (
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium">{value}</Text>
          <Text fontSize="xs" color="gray.500">
            {row.passenger?.phone || 'N/A'}
          </Text>
        </VStack>
      )
    },
    {
      header: 'Driver',
      accessor: 'driver_name',
      cell: (value, row) => (
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium">{value}</Text>
          <Text fontSize="xs" color="gray.500">
            {row.driver?.phone || 'N/A'}
          </Text>
        </VStack>
      )
    },
    {
      header: 'Route',
      accessor: 'pickup_address',
      cell: (value, row) => (
        <Box maxW="200px">
          <Tooltip label={`From: ${value}\nTo: ${row.dropoff_address}`}>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" noOfLines={1}>
                📍 {value}
              </Text>
              <Text fontSize="xs" color="gray.500" noOfLines={1}>
                → {row.dropoff_address}
              </Text>
            </VStack>
          </Tooltip>
        </Box>
      )
    },
    {
      header: 'Amount',
      accessor: 'total_amount',
      cell: (value, row) => (
        <VStack align="start" spacing={1}>
          <Text fontWeight="bold" color="green.600">
            {formatCurrency(value, row.currency)}
          </Text>
          {row.commission_amount && (
            <Text fontSize="xs" color="gray.500">
              Comm: {formatCurrency(row.commission_amount, row.currency)}
            </Text>
          )}
        </VStack>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (value, row) => (
        <StatusBadge status={value} entityType="trip" />
      )
    },
    {
      header: 'Payment',
      accessor: 'payment_status',
      cell: (value) => (
        <Badge
          colorScheme={
            value === 'paid' ? 'green' :
            value === 'refunded' ? 'blue' :
            value === 'failed' ? 'red' : 'yellow'
          }
          variant="subtle"
        >
          {value}
        </Badge>
      )
    },
    {
      header: 'Created',
      accessor: 'created_at',
      cell: (value) => (
        <Tooltip label={formatDate(value, 'full')}>
          <Text fontSize="sm">
            {formatDate(value, 'relative')}
          </Text>
        </Tooltip>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      cell: (value, row) => (
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<ChevronDownIcon />}
            variant="ghost"
            size="sm"
          />
          <MenuList>
            <MenuItem
              icon={<EyeIcon />}
              as={RouterLink}
              to={`/operations/trips/${value}`}
            >
              View Details
            </MenuItem>
            
            {hasPermission('trips', 'view') && row.status === 'completed' && row.payment_status === 'paid' && (
              <MenuItem
                icon={<RepeatIcon />}
                onClick={() => {
                  setSelectedTrip(row);
                  setIsRefundModalOpen(true);
                }}
              >
                Process Refund
              </MenuItem>
            )}
            
            {hasPermission('trips', 'delete') && (
              <MenuItem
                icon={<DollarIcon />}
                onClick={() => {
                  // Handle additional actions
                }}
              >
                Adjust Fare
              </MenuItem>
            )}
          </MenuList>
        </Menu>
      )
    }
  ];

  if (loading && !trips.length) {
    return <LoadingSpinner fullPage text="Loading trip history..." />;
  }

  if (error) {
    return (
      <Box p={8} textAlign="center">
        <Heading size="lg" color="red.500" mb={4}>
          Error Loading Trips
        </Heading>
        <Text color="gray.600">{error}</Text>
        <Button mt={4} onClick={() => fetchTrips()}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Trip History
          </Heading>
          <Text color="gray.600">
            Review completed, cancelled, and historical trip records for auditing and analytics
          </Text>
        </Box>

        {/* Statistics Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Trips</StatLabel>
                <StatNumber>{stats.totalTrips}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  12%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Revenue</StatLabel>
                <StatNumber>{formatCurrency(stats.totalRevenue, 'USD')}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  8%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Avg Rating</StatLabel>
                <StatNumber>{stats.averageRating}</StatNumber>
                <StatHelpText>
                  <FaStar style={{ display: 'inline', color: '#fbbf24' }} /> / 5
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Completed</StatLabel>
                <StatNumber>{stats.completedTrips}</StatNumber>
                <StatHelpText>
                  {stats.completionRate}% completion rate
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Cancelled</StatLabel>
                <StatNumber>{stats.cancelledTrips}</StatNumber>
                <StatHelpText>
                  {(stats.cancelledTrips / stats.totalTrips * 100).toFixed(1)}% rate
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <HStack width="100%" spacing={4} wrap="wrap">
                {/* Search */}
                <InputGroup flex="1" minW="200px">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search trips, passengers, drivers..."
                    value={filters.search}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </InputGroup>

                {/* Status Filter */}
                <Select
                  width="150px"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  placeholder="All Status"
                >
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                  <option value="no_show">No Show</option>
                  <option value="refunded">Refunded</option>
                </Select>

                {/* Payment Status */}
                <Select
                  width="150px"
                  value={filters.payment_status}
                  onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                  placeholder="Payment Status"
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                </Select>

                {/* Date Range */}
                <Select
                  width="150px"
                  value={filters.date_range}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </Select>
              </HStack>

              {/* Action Buttons */}
              <HStack width="100%" justify="space-between">
                <HStack spacing={2}>
                  <Button
                    leftIcon={<FilterIcon />}
                    variant="outline"
                    onClick={() => {
                      // Reset filters
                      setFilters({
                        status: '',
                        payment_status: '',
                        vehicle_type: '',
                        date_range: '7d',
                        search: '',
                        page: 1,
                        limit: 20,
                        sortBy: 'created_at',
                        sortOrder: 'desc'
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                  
                  <Button
                    leftIcon={<RepeatIcon />}
                    onClick={() => fetchTrips()}
                    isLoading={loading}
                  >
                    Refresh
                  </Button>
                </HStack>

                <HStack spacing={2}>
                  <Menu>
                    <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                      <DownloadIcon mr={2} />
                      Export
                    </MenuButton>
                    <MenuList>
                      <MenuItem
                        icon={<DownloadIcon />}
                        onClick={() => handleExport('csv')}
                        isLoading={exportLoading}
                      >
                        Export as CSV
                      </MenuItem>
                      <MenuItem
                        icon={<DownloadIcon />}
                        onClick={() => handleExport('json')}
                        isLoading={exportLoading}
                      >
                        Export as JSON
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </HStack>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Tabs for different views */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>All Trips ({trips.length})</Tab>
            <Tab>Completed ({trips.filter(t => t.status === 'completed').length})</Tab>
            <Tab>Cancelled ({trips.filter(t => t.status === 'cancelled').length})</Tab>
            <Tab>Disputed ({trips.filter(t => t.status === 'disputed').length})</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              {/* Data Table */}
              <Card>
                <CardBody p={0}>
                  <DataTable
                    columns={columns}
                    data={trips}
                    loading={loading}
                    pagination={{
                      currentPage: pagination.page,
                      totalPages: pagination.totalPages,
                      totalItems: pagination.total,
                      onPageChange: handlePageChange,
                      pageSize: filters.limit,
                      onPageSizeChange: (size) => handleFilterChange('limit', size)
                    }}
                    emptyMessage="No trip history found. Try adjusting your filters."
                  />
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Completed Trips Tab */}
            <TabPanel p={0}>
              <Card>
                <CardBody p={0}>
                  <DataTable
                    columns={columns}
                    data={trips.filter(t => t.status === 'completed')}
                    loading={loading}
                    emptyMessage="No completed trips found."
                  />
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Cancelled Trips Tab */}
            <TabPanel p={0}>
              <Card>
                <CardBody p={0}>
                  <DataTable
                    columns={columns}
                    data={trips.filter(t => t.status === 'cancelled')}
                    loading={loading}
                    emptyMessage="No cancelled trips found."
                  />
                </CardBody>
              </Card>
            </TabPanel>
            
            {/* Disputed Trips Tab */}
            <TabPanel p={0}>
              <Card>
                <CardBody p={0}>
                  <DataTable
                    columns={columns}
                    data={trips.filter(t => t.status === 'disputed')}
                    loading={loading}
                    emptyMessage="No disputed trips found."
                  />
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Detailed Summary */}
        {trips.length > 0 && (
          <Card>
            <CardHeader>
              <Heading size="md">Trip Summary</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Average Trip Distance
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {trips.length > 0 
                      ? formatDistance(trips.reduce((sum, t) => sum + t.distance, 0) / trips.length)
                      : 'N/A'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Average Trip Duration
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {trips.length > 0
                      ? formatDuration(trips.reduce((sum, t) => sum + t.duration, 0) / trips.length)
                      : 'N/A'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Average Fare
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {trips.length > 0
                      ? formatCurrency(trips.reduce((sum, t) => sum + t.total_amount, 0) / trips.length, 'USD')
                      : 'N/A'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Top Vehicle Type
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {trips.length > 0
                      ? trips.reduce((acc, t) => {
                          acc[t.vehicle_type] = (acc[t.vehicle_type] || 0) + 1;
                          return acc;
                        }, {})
                      : 'N/A'}
                  </Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Refund Modal */}
      <ConfirmationModal
        isOpen={isRefundModalOpen}
        onClose={() => {
          setIsRefundModalOpen(false);
          setRefundAmount('');
          setRefundReason('');
          setSelectedTrip(null);
        }}
        onConfirm={handleRefund}
        title="Process Refund"
        type="warning"
        confirmText="Process Refund"
        cancelText="Cancel"
        confirmColorScheme="orange"
      >
        {selectedTrip && (
          <VStack spacing={4} align="stretch" mt={4}>
            <Box>
              <Text fontWeight="medium">Trip Details:</Text>
              <Text fontSize="sm" color="gray.600">
                ID: {selectedTrip.id} | Amount: {formatCurrency(selectedTrip.total_amount, selectedTrip.currency)}
              </Text>
            </Box>
            
            <Box>
              <Text mb={2} fontSize="sm">Refund Amount:</Text>
              <Input
                type="number"
                placeholder="Enter refund amount"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={selectedTrip.total_amount}
                min="0"
                step="0.01"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                Maximum: {formatCurrency(selectedTrip.total_amount, selectedTrip.currency)}
              </Text>
            </Box>
            
            <Box>
              <Text mb={2} fontSize="sm">Refund Reason:</Text>
              <Input
                placeholder="Enter reason for refund"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </Box>
          </VStack>
        )}
      </ConfirmationModal>
    </Box>
  );
};

export default TripHistory;