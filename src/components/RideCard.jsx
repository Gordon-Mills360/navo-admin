import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Select,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
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
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  Grid,
  GridItem,
  Divider,
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
  Progress,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaFilter,
  FaSync,
  FaEye,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaUser,
  FaCar,
  FaRoute,
  FaDollarSign,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaEllipsisV,
  FaPlus,
  FaChartLine,
} from 'react-icons/fa';
import { supabase } from '../services/supabase';
import RideCard from '../components/RideCard';
import PageContainer from '../components/PageContainer';

const Rides = () => {
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
    cancelled: 0,
    pending: 0,
    revenue: 0,
  });
  
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const toast = useToast();

  // Safe column check - don't query columns that don't exist
  const checkTableStructure = useCallback(async () => {
    try {
      // Try a simple query to see what columns exist
      const { data, error } = await supabase
        .from('rides')
        .select('id, status, created_at')
        .limit(1);
      
      if (error) {
        console.error('Error checking rides table structure:', error);
        return { hasBasicColumns: false, error: error.message };
      }
      
      // Check if we can query with joins
      const { data: joinedData, error: joinError } = await supabase
        .from('rides')
        .select(`
          id,
          status,
          passenger:passenger_id (
            id,
            full_name
          )
        `)
        .limit(1);
      
      return { 
        hasBasicColumns: true, 
        canJoin: !joinError,
        error: joinError?.message 
      };
    } catch (error) {
      console.error('Error checking table structure:', error);
      return { hasBasicColumns: false, error: error.message };
    }
  }, []);

  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check table structure first
      const tableInfo = await checkTableStructure();
      console.log('Table structure info:', tableInfo);
      
      if (!tableInfo.hasBasicColumns) {
        throw new Error(`Cannot access rides table: ${tableInfo.error || 'Table may not exist'}`);
      }
      
      // Build safe query based on what columns exist
      let query = supabase.from('rides').select();
      
      // Add basic columns that should exist
      let selectFields = 'id, status, created_at, updated_at';
      
      // Add fare columns with fallbacks
      selectFields += ', fare, fare_amount, actual_fare';
      
      // Add location columns
      selectFields += ', pickup_location, dropoff_location';
      
      // Add payment info
      selectFields += ', payment_status, payment_id, commission, driver_payout';
      
      // Add driver and passenger IDs
      selectFields += ', passenger_id, driver_id';
      
      // Try to add joins if they work
      if (tableInfo.canJoin) {
        selectFields += `
          , passenger:passenger_id (
            id,
            email,
            full_name,
            phone
          ),
          driver:driver_id (
            id,
            full_name,
            phone,
            vehicle_number
          )
        `;
      }
      
      // Add optional columns that might exist
      selectFields += ', distance_km, duration_min, city, cancellation_reason, notes';
      selectFields += ', accepted_at, arrived_at, started_at, completed_at, cancelled_at';
      
      // Execute query
      const { data, error } = await supabase
        .from('rides')
        .select(selectFields)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Failed to fetch rides: ${error.message}`);
      }
      
      console.log(`Fetched ${data?.length || 0} rides`);
      setRides(data || []);
      setFilteredRides(data || []);
      
      // Calculate statistics
      if (data && data.length > 0) {
        const total = data.length;
        const completed = data.filter(r => r.status === 'completed' || r.status === 'PAID').length;
        const active = data.filter(r => 
          ['requested', 'accepted', 'arrived', 'started', 'in_progress'].includes(r.status)
        ).length;
        const cancelled = data.filter(r => r.status === 'cancelled').length;
        const pending = data.filter(r => r.status === 'requested').length;
        
        // Calculate revenue from completed rides
        const revenue = data
          .filter(r => r.status === 'completed' || r.status === 'PAID')
          .reduce((sum, ride) => sum + (ride.actual_fare || ride.fare || ride.fare_amount || 0), 0);
        
        setStats({
          total,
          completed,
          active,
          cancelled,
          pending,
          revenue,
        });
      } else {
        setStats({
          total: 0,
          completed: 0,
          active: 0,
          cancelled: 0,
          pending: 0,
          revenue: 0,
        });
      }
      
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError(error.message);
      toast({
        title: 'Failed to load rides',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [checkTableStructure, toast]);

  useEffect(() => {
    fetchRides();
    
    // Set up real-time subscription for rides
    const ridesSubscription = supabase
      .channel('rides_updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rides' 
        }, 
        (payload) => {
          console.log('Ride update received:', payload);
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ridesSubscription);
    };
  }, [fetchRides]);

  // Filter rides based on search and status
  useEffect(() => {
    if (!rides.length) {
      setFilteredRides([]);
      return;
    }
    
    let filtered = rides;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ride => {
        if (statusFilter === 'active') {
          return ['requested', 'accepted', 'arrived', 'started', 'in_progress'].includes(ride.status);
        }
        return ride.status === statusFilter;
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ride => {
        const passengerName = ride.passenger?.full_name || ride.passenger?.name || '';
        const driverName = ride.driver?.full_name || ride.driver?.name || '';
        const pickupLocation = ride.pickup_location || '';
        const dropoffLocation = ride.dropoff_location || '';
        const rideId = ride.id || '';
        
        return (
          passengerName.toLowerCase().includes(term) ||
          driverName.toLowerCase().includes(term) ||
          pickupLocation.toLowerCase().includes(term) ||
          dropoffLocation.toLowerCase().includes(term) ||
          rideId.toLowerCase().includes(term)
        );
      });
    }
    
    setFilteredRides(filtered);
  }, [rides, searchTerm, statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRides();
  };

  const handleViewRide = (ride) => {
    setSelectedRide(ride);
    onViewOpen();
  };

  const handleStatusUpdate = (updatedRide) => {
    setRides(prev => prev.map(r => r.id === updatedRide.id ? updatedRide : r));
    
    if (selectedRide?.id === updatedRide.id) {
      setSelectedRide(updatedRide);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₵0.00';
    return `₵${parseFloat(amount).toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'green';
      case 'accepted':
      case 'arrived':
      case 'started':
      case 'in_progress':
        return 'blue';
      case 'requested':
        return 'orange';
      case 'completed_pending_payment':
        return 'yellow';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'requested': 'Looking for Driver',
      'accepted': 'Driver Assigned',
      'arrived': 'Driver Arrived',
      'started': 'Ride Started',
      'in_progress': 'Ride in Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'completed_pending_payment': 'Pending Payment',
      'paid': 'Paid',
    };
    
    return statusMap[status?.toLowerCase()] || status?.replace('_', ' ').toUpperCase() || 'Unknown';
  };

  if (error) {
    return (
      <PageContainer
        title="Rides Management"
        subtitle="View and manage all tricycle rides"
      >
        <Alert status="error" borderRadius="lg" mb={6}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Failed to Load Rides</AlertTitle>
            <AlertDescription fontSize="sm">
              {error}
            </AlertDescription>
          </Box>
          <Button
            leftIcon={<FaSync />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            Retry
          </Button>
        </Alert>
        
        <Card>
          <CardBody textAlign="center" py={10}>
            <FaRoute size={48} color="#CBD5E0" />
            <Text mt={4} color="gray.600">
              Unable to load rides data. Please check your database connection.
            </Text>
            <Button
              mt={4}
              colorScheme="brand"
              onClick={handleRefresh}
              isLoading={refreshing}
            >
              Refresh Data
            </Button>
          </CardBody>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Rides Management"
      subtitle="View and manage all tricycle rides"
      action={
        <Button
          leftIcon={<FaSync />}
          size="sm"
          onClick={handleRefresh}
          isLoading={refreshing}
          variant="outline"
        >
          Refresh
        </Button>
      }
    >
      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4} mb={6}>
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Total Rides</StatLabel>
              <StatNumber fontSize="xl">{stats.total}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                23.36%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Completed</StatLabel>
              <StatNumber fontSize="xl" color="green.500">{stats.completed}</StatNumber>
              <StatHelpText fontSize="xs">
                {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}% rate
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Active</StatLabel>
              <StatNumber fontSize="xl" color="blue.500">{stats.active}</StatNumber>
              <StatHelpText fontSize="xs">
                {stats.pending} requested
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Cancelled</StatLabel>
              <StatNumber fontSize="xl" color="red.500">{stats.cancelled}</StatNumber>
              <StatHelpText fontSize="xs">
                {stats.total > 0 ? ((stats.cancelled / stats.total) * 100).toFixed(1) : 0}% rate
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Revenue</StatLabel>
              <StatNumber fontSize="xl">{formatCurrency(stats.revenue)}</StatNumber>
              <StatHelpText fontSize="xs">
                From {stats.completed} rides
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Completion</StatLabel>
              <StatNumber fontSize="xl">
                {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
              </StatNumber>
              <Progress 
                value={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0} 
                colorScheme="green" 
                size="sm" 
                mt={2}
              />
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters and Search */}
      <Card mb={6}>
        <CardBody>
          <Grid templateColumns={{ base: '1fr', md: '2fr 1fr auto' }} gap={4} alignItems="center">
            <GridItem>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search rides by passenger, driver, location, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="white"
                />
              </InputGroup>
            </GridItem>
            
            <GridItem>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                bg="white"
                leftIcon={<FaFilter />}
              >
                <option value="all">All Status</option>
                <option value="active">Active Rides</option>
                <option value="requested">Requested</option>
                <option value="accepted">Accepted</option>
                <option value="arrived">Arrived</option>
                <option value="started">Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </GridItem>
            
            <GridItem>
              <Button
                leftIcon={<FaSync />}
                onClick={handleRefresh}
                isLoading={refreshing}
                variant="outline"
                width="full"
              >
                Refresh
              </Button>
            </GridItem>
          </Grid>
          
          <HStack mt={4} spacing={3} flexWrap="wrap">
            <Badge colorScheme="gray" px={3} py={1}>
              Total: {filteredRides.length}
            </Badge>
            <Badge colorScheme="green" px={3} py={1}>
              Completed: {filteredRides.filter(r => r.status === 'completed' || r.status === 'PAID').length}
            </Badge>
            <Badge colorScheme="blue" px={3} py={1}>
              Active: {filteredRides.filter(r => ['requested', 'accepted', 'arrived', 'started', 'in_progress'].includes(r.status)).length}
            </Badge>
            <Badge colorScheme="red" px={3} py={1}>
              Cancelled: {filteredRides.filter(r => r.status === 'cancelled').length}
            </Badge>
          </HStack>
        </CardBody>
      </Card>

      {/* Rides List */}
      {loading ? (
        <Card>
          <CardBody textAlign="center" py={20}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text mt={4} color="gray.600">
              Loading rides...
            </Text>
          </CardBody>
        </Card>
      ) : filteredRides.length === 0 ? (
        <Card>
          <CardBody textAlign="center" py={20}>
            <FaRoute size={64} color="#CBD5E0" />
            <Text mt={4} fontSize="lg" color="gray.600">
              {rides.length === 0 ? 'No rides found in the system' : 'No rides match your search criteria'}
            </Text>
            {rides.length === 0 && (
              <Text fontSize="sm" color="gray.500" mt={2}>
                Rides will appear here when passengers request trips
              </Text>
            )}
            <Button
              mt={6}
              colorScheme="brand"
              leftIcon={<FaSync />}
              onClick={handleRefresh}
            >
              Refresh Data
            </Button>
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {/* Table View for larger screens */}
          <Box display={{ base: 'none', lg: 'block' }}>
            <Card>
              <CardBody p={0}>
                <Table variant="simple">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>ID</Th>
                      <Th>Passenger</Th>
                      <Th>Driver</Th>
                      <Th>Route</Th>
                      <Th>Fare</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredRides.map((ride) => (
                      <Tr key={ride.id} _hover={{ bg: 'gray.50' }}>
                        <Td fontSize="sm" fontFamily="mono">
                          #{ride.id.substring(0, 8)}
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">
                              {ride.passenger?.full_name || ride.passenger?.name || 'Unknown'}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {ride.passenger?.phone || 'N/A'}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">
                              {ride.driver?.full_name || ride.driver?.name || 'Not assigned'}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              {ride.driver?.vehicle_number || 'N/A'}
                            </Text>
                          </VStack>
                        </Td>
                        <Td maxW="200px">
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" noOfLines={1}>
                              <FaMapMarkerAlt size={10} style={{ display: 'inline', marginRight: 4 }} />
                              {ride.pickup_location?.substring(0, 30) || 'Pickup'}...
                            </Text>
                            <Text fontSize="sm" noOfLines={1}>
                              <FaMapMarkerAlt size={10} style={{ display: 'inline', marginRight: 4 }} />
                              {ride.dropoff_location?.substring(0, 30) || 'Destination'}...
                            </Text>
                          </VStack>
                        </Td>
                        <Td fontWeight="bold">
                          {formatCurrency(ride.actual_fare || ride.fare || ride.fare_amount)}
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getStatusColor(ride.status)}
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="xs"
                          >
                            {getStatusText(ride.status)}
                          </Badge>
                        </Td>
                        <Td fontSize="sm">
                          {formatDate(ride.created_at)}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<FaEye />}
                              size="sm"
                              onClick={() => handleViewRide(ride)}
                              aria-label="View ride"
                            />
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FaEllipsisV />}
                                size="sm"
                                variant="ghost"
                                aria-label="More options"
                              />
                              <MenuList>
                                <MenuItem icon={<FaEdit />}>Edit Ride</MenuItem>
                                <MenuItem icon={<FaTrash />} color="red.500">
                                  Delete Ride
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </Box>

          {/* Card View for mobile */}
          <Box display={{ base: 'block', lg: 'none' }}>
            <VStack spacing={4} align="stretch">
              {filteredRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </VStack>
          </Box>
        </VStack>
      )}

      {/* View Ride Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ride Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRide ? (
              <VStack spacing={4} align="stretch">
                {/* Basic Info */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Ride ID</Text>
                    <Text fontWeight="medium" fontFamily="mono">
                      #{selectedRide.id.substring(0, 12)}...
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Status</Text>
                    <Badge
                      colorScheme={getStatusColor(selectedRide.status)}
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {getStatusText(selectedRide.status)}
                    </Badge>
                  </Box>
                </SimpleGrid>
                
                <Divider />
                
                {/* Passenger Info */}
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>Passenger</Text>
                  <HStack>
                    <FaUser color="#4A5568" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">
                        {selectedRide.passenger?.full_name || selectedRide.passenger?.name || 'Unknown'}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedRide.passenger?.phone || 'N/A'} • {selectedRide.passenger?.email || 'N/A'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
                
                {/* Driver Info */}
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>Driver</Text>
                  <HStack>
                    <FaCar color="#4A5568" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">
                        {selectedRide.driver?.full_name || selectedRide.driver?.name || 'Not assigned'}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedRide.driver?.phone || 'N/A'} • {selectedRide.driver?.vehicle_number || 'N/A'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
                
                <Divider />
                
                {/* Route Info */}
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>Route</Text>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <FaMapMarkerAlt color="#38A169" />
                      <Text>
                        {selectedRide.pickup_location || 'Pickup location not specified'}
                      </Text>
                    </HStack>
                    <HStack>
                      <FaMapMarkerAlt color="#E53E3E" />
                      <Text>
                        {selectedRide.dropoff_location || 'Destination not specified'}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                
                {/* Fare Info */}
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Fare</Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {formatCurrency(selectedRide.actual_fare || selectedRide.fare || selectedRide.fare_amount)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Payment Status</Text>
                    <Badge
                      colorScheme={selectedRide.payment_status === 'paid' ? 'green' : 'yellow'}
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {selectedRide.payment_status?.toUpperCase() || 'PENDING'}
                    </Badge>
                  </Box>
                </SimpleGrid>
                
                {/* Timestamps */}
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>Timestamps</Text>
                  <SimpleGrid columns={2} spacing={2}>
                    <Text fontSize="sm">Created:</Text>
                    <Text fontSize="sm">{formatDate(selectedRide.created_at)}</Text>
                    
                    {selectedRide.accepted_at && (
                      <>
                        <Text fontSize="sm">Accepted:</Text>
                        <Text fontSize="sm">{formatDate(selectedRide.accepted_at)}</Text>
                      </>
                    )}
                    
                    {selectedRide.started_at && (
                      <>
                        <Text fontSize="sm">Started:</Text>
                        <Text fontSize="sm">{formatDate(selectedRide.started_at)}</Text>
                      </>
                    )}
                    
                    {selectedRide.completed_at && (
                      <>
                        <Text fontSize="sm">Completed:</Text>
                        <Text fontSize="sm">{formatDate(selectedRide.completed_at)}</Text>
                      </>
                    )}
                    
                    {selectedRide.cancelled_at && (
                      <>
                        <Text fontSize="sm">Cancelled:</Text>
                        <Text fontSize="sm">{formatDate(selectedRide.cancelled_at)}</Text>
                      </>
                    )}
                  </SimpleGrid>
                </Box>
                
                {/* Additional Info */}
                {selectedRide.distance_km && (
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Distance</Text>
                      <Text>{parseFloat(selectedRide.distance_km).toFixed(1)} km</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Duration</Text>
                      <Text>
                        {selectedRide.duration_min 
                          ? selectedRide.duration_min < 60 
                            ? `${selectedRide.duration_min} min` 
                            : `${Math.floor(selectedRide.duration_min / 60)}h ${selectedRide.duration_min % 60}m`
                          : 'N/A'}
                      </Text>
                    </Box>
                  </SimpleGrid>
                )}
                
                {selectedRide.cancellation_reason && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Cancellation Reason</Text>
                    <Text p={3} bg="red.50" borderRadius="md">
                      {selectedRide.cancellation_reason}
                    </Text>
                  </Box>
                )}
                
                {selectedRide.notes && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>Notes</Text>
                    <Text p={3} bg="gray.50" borderRadius="md">
                      {selectedRide.notes}
                    </Text>
                  </Box>
                )}
              </VStack>
            ) : (
              <Text>No ride selected</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onViewClose}>
              Close
            </Button>
            <Button colorScheme="brand">
              Edit Ride
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default Rides;