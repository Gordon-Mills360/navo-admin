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
  Avatar,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import {
  FaSearch,
  FaFilter,
  FaMotorcycle,
  FaUser,
  FaUserFriends,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaBan,
  FaEye,
  FaRedo,
  FaRoute,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaEllipsisV,
  FaMap,
  FaDirections,
} from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { useTripManagement } from '../../../hooks/useTripManagement';
import { supabase } from '../../../services/supabase';
import Layout from '../../../components/layout/Layout';

const LiveTrips = () => {
  const { admin } = useAuth();
  const { forceCancelTrip, reassignDriver, handleEmergency } = useTripManagement();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cancelReason, setCancelReason] = useState('');
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const [reassignDriverId, setReassignDriverId] = useState('');
  const { isOpen: isReassignOpen, onOpen: onReassignOpen, onClose: onReassignClose } = useDisclosure();
  const [availableDrivers, setAvailableDrivers] = useState([]);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          passenger:passenger_id (id, full_name, email, phone, avatar_url),
          driver:driver_id (id, full_name, email, phone, avatar_url, vehicle_number),
          payments (id, amount, status)
        `)
        .in('status', ['requested', 'assigned', 'driver_arriving', 'in_progress', 'completed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setTrips(data || []);
      setFilteredTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, rating, vehicle_number')
        .eq('status', 'online')
        .order('rating', { ascending: false });

      if (error) throw error;
      setAvailableDrivers(data || []);
    } catch (error) {
      console.error('Error fetching available drivers:', error);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchAvailableDrivers();
    
    const subscription = supabase
      .channel('trips_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchTrips)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    let filtered = trips;
    
    if (searchTerm) {
      filtered = filtered.filter(trip =>
        trip.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.passenger?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }
    
    setFilteredTrips(filtered);
  }, [trips, searchTerm, statusFilter]);

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    onOpen();
  };

  const handleCancelTrip = (trip) => {
    setSelectedTrip(trip);
    onCancelOpen();
  };

  const confirmCancel = async () => {
    if (cancelReason && selectedTrip) {
      await forceCancelTrip(selectedTrip.id, cancelReason, admin.id);
      setCancelReason('');
      onCancelClose();
      fetchTrips();
    }
  };

  const handleReassign = (trip) => {
    setSelectedTrip(trip);
    fetchAvailableDrivers();
    onReassignOpen();
  };

  const confirmReassign = async () => {
    if (reassignDriverId && selectedTrip) {
      await reassignDriver(selectedTrip.id, reassignDriverId, admin.id);
      setReassignDriverId('');
      onReassignClose();
      fetchTrips();
    }
  };

  const handleEmergencyAction = async (trip, action) => {
    switch (action) {
      case 'call_passenger':
        alert(`Calling passenger: ${trip.passenger?.phone}`);
        break;
      case 'call_driver':
        alert(`Calling driver: ${trip.driver?.phone}`);
        break;
      case 'report_emergency':
        await handleEmergency(
          trip.id,
          'safety_threat',
          {
            description: 'Emergency reported by admin',
            actions: ['call_driver', 'call_passenger']
          },
          admin.id
        );
        alert('Emergency reported and logged');
        break;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'green';
      case 'driver_arriving': return 'blue';
      case 'assigned': return 'yellow';
      case 'requested': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress': return FaMotorcycle;
      case 'driver_arriving': return FaMapMarkerAlt;
      case 'assigned': return FaUserFriends;
      case 'requested': return FaClock;
      case 'completed': return FaCheckCircle;
      case 'cancelled': return FaTimesCircle;
      default: return FaClock;
    }
  };

  const formatDuration = (startTime) => {
    if (!startTime) return 'N/A';
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 60000); // minutes
    
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const stats = {
    total: trips.length,
    active: trips.filter(t => ['requested', 'assigned', 'driver_arriving', 'in_progress'].includes(t.status)).length,
    completed: trips.filter(t => t.status === 'completed').length,
    cancelled: trips.filter(t => t.status === 'cancelled').length,
    revenue: trips.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.estimated_fare || 0), 0),
  };

  const liveTripColumns = [
    {
      key: 'trip',
      header: 'Trip',
      render: (value, trip) => (
        <Box>
          <Text fontFamily="mono" fontSize="xs" color="gray.500" mb={1}>
            {trip.id.slice(0, 8)}...
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {trip.pickup_location?.slice(0, 30)}...
          </Text>
        </Box>
      ),
    },
    {
      key: 'passenger',
      header: 'Passenger',
      render: (value, trip) => (
        <HStack spacing={2}>
          <Avatar
            size="xs"
            name={trip.passenger?.full_name}
            src={trip.passenger?.avatar_url}
          />
          <Text fontSize="sm">{trip.passenger?.full_name || 'N/A'}</Text>
        </HStack>
      ),
    },
    {
      key: 'driver',
      header: 'Driver',
      render: (value, trip) => (
        trip.driver ? (
          <HStack spacing={2}>
            <Avatar
              size="xs"
              name={trip.driver?.full_name}
              src={trip.driver?.avatar_url}
            />
            <Text fontSize="sm">{trip.driver?.full_name || 'N/A'}</Text>
          </HStack>
        ) : (
          <Text fontSize="sm" color="gray.500">Unassigned</Text>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const Icon = getStatusIcon(value);
        return (
          <Badge
            colorScheme={getStatusColor(value)}
            variant="subtle"
            fontSize="xs"
            px={3}
            py={1}
            display="flex"
            alignItems="center"
            gap={2}
          >
            <Icon size={10} />
            {value.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (value, trip) => (
        <Text fontSize="sm">
          {formatDuration(trip.created_at)}
        </Text>
      ),
    },
    {
      key: 'fare',
      header: 'Fare',
      render: (value) => (
        <Text fontSize="sm" fontWeight="medium">
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value, trip) => (
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaEllipsisV />}
            size="sm"
            variant="ghost"
          />
          <MenuList minW="200px">
            <MenuItem
              icon={<FaEye />}
              onClick={() => handleViewTrip(trip)}
            >
              View Details
            </MenuItem>
            {trip.driver && (
              <MenuItem
                icon={<FaPhone />}
                onClick={() => alert(`Calling driver: ${trip.driver?.phone}`)}
              >
                Call Driver
              </MenuItem>
            )}
            <MenuItem
              icon={<FaPhone />}
              onClick={() => alert(`Calling passenger: ${trip.passenger?.phone}`)}
            >
              Call Passenger
            </MenuItem>
            {['requested', 'assigned', 'driver_arriving', 'in_progress'].includes(trip.status) && (
              <>
                <MenuItem
                  icon={<FaRoute />}
                  onClick={() => handleReassign(trip)}
                >
                  Reassign Driver
                </MenuItem>
                <MenuItem
                  icon={<FaBan />}
                  colorScheme="red"
                  onClick={() => handleCancelTrip(trip)}
                >
                  Cancel Trip
                </MenuItem>
              </>
            )}
            <MenuItem
              icon={<FaExclamationTriangle />}
              colorScheme="red"
              onClick={() => handleEmergencyAction(trip, 'report_emergency')}
            >
              Report Emergency
            </MenuItem>
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
              Live Trips Management
            </Heading>
            <Text color="gray.600" mt={1}>
              Monitor and manage all trips in real-time
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FaMap />}
              colorScheme="brand"
              size="sm"
              onClick={() => window.location.href = '/operations/map-view'}
            >
              Map View
            </Button>
            <Button
              leftIcon={<FaRedo />}
              variant="outline"
              size="sm"
              onClick={fetchTrips}
              isLoading={loading}
            >
              Refresh
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
              <Text fontSize="sm" color="gray.600">Total Trips</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {stats.active}
              </Text>
              <Text fontSize="sm" color="gray.600">Active Now</Text>
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
              <Text fontSize="2xl" fontWeight="bold" color="red.600">
                {stats.cancelled}
              </Text>
              <Text fontSize="sm" color="gray.600">Cancelled</Text>
            </CardBody>
          </Card>
          
          <Card bg="white" borderWidth="1px" borderColor="gray.200">
            <CardBody textAlign="center">
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                {formatCurrency(stats.revenue)}
              </Text>
              <Text fontSize="sm" color="gray.600">Revenue</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Flex gap={4} wrap="wrap">
          <InputGroup flex={1} minW="300px">
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search trips by ID, passenger, driver, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="lg"
            />
          </InputGroup>
          
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            width="200px"
            borderRadius="lg"
          >
            <option value="all">All Status</option>
            <option value="requested">Requested</option>
            <option value="assigned">Assigned</option>
            <option value="driver_arriving">Driver Arriving</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          
          <Button
            leftIcon={<FaFilter />}
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </Flex>

        {/* Active Trips Alert */}
        {stats.active > 0 && (
          <Alert status="info" borderRadius="lg">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>{stats.active} Active Trips</AlertTitle>
              <AlertDescription>
                Monitor these trips for any issues or emergencies
              </AlertDescription>
            </Box>
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={() => setStatusFilter('in_progress')}
            >
              View Active
            </Button>
          </Alert>
        )}

        {/* Trips Table */}
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
                  {liveTripColumns.map((column) => (
                    <Th key={column.key}>{column.header}</Th>
                  ))}
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={liveTripColumns.length} textAlign="center" py={10}>
                      <Text color="gray.500">Loading trips...</Text>
                    </Td>
                  </Tr>
                ) : filteredTrips.length === 0 ? (
                  <Tr>
                    <Td colSpan={liveTripColumns.length} textAlign="center" py={10}>
                      <Text color="gray.500">No trips found matching your filters</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredTrips.map((trip) => (
                    <Tr key={trip.id} _hover={{ bg: 'gray.50' }}>
                      {liveTripColumns.map((column) => (
                        <Td key={column.key}>
                          {column.render ? column.render(trip[column.key], trip) : trip[column.key]}
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>

        {/* Trip Status Distribution */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Trip Status Distribution</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {[
                { status: 'requested', label: 'Requested', color: 'orange', count: trips.filter(t => t.status === 'requested').length },
                { status: 'assigned', label: 'Assigned', color: 'yellow', count: trips.filter(t => t.status === 'assigned').length },
                { status: 'in_progress', label: 'In Progress', color: 'green', count: trips.filter(t => t.status === 'in_progress').length },
                { status: 'completed', label: 'Completed', color: 'blue', count: trips.filter(t => t.status === 'completed').length },
              ].map((stat) => (
                <Box key={stat.status}>
                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="sm" color="gray.600">
                      {stat.label}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {stat.count}
                    </Text>
                  </Flex>
                  <Progress
                    value={(stat.count / Math.max(stats.total, 1)) * 100}
                    colorScheme={stat.color}
                    size="lg"
                    borderRadius="full"
                  />
                </Box>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>

      {/* Trip Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Trip Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTrip && (
              <VStack spacing={6} align="stretch">
                {/* Trip Header */}
                <Flex justify="space-between" align="center">
                  <Box>
                    <Heading size="md">Trip #{selectedTrip.id.slice(0, 8)}</Heading>
                    <Text color="gray.600">
                      {new Date(selectedTrip.created_at).toLocaleString()}
                    </Text>
                  </Box>
                  <Badge
                    colorScheme={getStatusColor(selectedTrip.status)}
                    variant="subtle"
                    fontSize="sm"
                    px={3}
                    py={1}
                  >
                    {selectedTrip.status.replace('_', ' ')}
                  </Badge>
                </Flex>

                <Tabs>
                  <TabList>
                    <Tab>Overview</Tab>
                    <Tab>Route</Tab>
                    <Tab>Payments</Tab>
                    <Tab>Actions</Tab>
                  </TabList>

                  <TabPanels>
                    <TabPanel>
                      <SimpleGrid columns={2} spacing={6}>
                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={2}>
                            Passenger
                          </Text>
                          <HStack spacing={3}>
                            <Avatar
                              size="md"
                              name={selectedTrip.passenger?.full_name}
                              src={selectedTrip.passenger?.avatar_url}
                            />
                            <Box>
                              <Text fontWeight="medium">{selectedTrip.passenger?.full_name}</Text>
                              <Text fontSize="sm" color="gray.500">{selectedTrip.passenger?.email}</Text>
                              <Text fontSize="sm" color="gray.500">{selectedTrip.passenger?.phone}</Text>
                            </Box>
                          </HStack>
                        </Box>

                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={2}>
                            Driver
                          </Text>
                          {selectedTrip.driver ? (
                            <HStack spacing={3}>
                              <Avatar
                                size="md"
                                name={selectedTrip.driver?.full_name}
                                src={selectedTrip.driver?.avatar_url}
                              />
                              <Box>
                                <Text fontWeight="medium">{selectedTrip.driver?.full_name}</Text>
                                <Text fontSize="sm" color="gray.500">{selectedTrip.driver?.vehicle_number}</Text>
                                <Text fontSize="sm" color="gray.500">{selectedTrip.driver?.phone}</Text>
                              </Box>
                            </HStack>
                          ) : (
                            <Text color="gray.500">No driver assigned</Text>
                          )}
                        </Box>

                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Pickup Location
                          </Text>
                          <Text fontWeight="medium">{selectedTrip.pickup_location}</Text>
                        </Box>

                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Dropoff Location
                          </Text>
                          <Text fontWeight="medium">{selectedTrip.dropoff_location}</Text>
                        </Box>

                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Estimated Fare
                          </Text>
                          <Text fontWeight="medium" fontSize="lg">
                            {formatCurrency(selectedTrip.estimated_fare)}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Actual Fare
                          </Text>
                          <Text fontWeight="medium" fontSize="lg">
                            {formatCurrency(selectedTrip.actual_fare)}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Distance
                          </Text>
                          <Text fontWeight="medium">
                            {selectedTrip.distance ? `${selectedTrip.distance} km` : 'N/A'}
                          </Text>
                        </Box>

                        <Box>
                          <Text fontSize="sm" color="gray.600" mb={1}>
                            Duration
                          </Text>
                          <Text fontWeight="medium">
                            {formatDuration(selectedTrip.created_at)}
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </TabPanel>

                    <TabPanel>
                      <Text color="gray.500">Route visualization would appear here</Text>
                    </TabPanel>

                    <TabPanel>
                      {selectedTrip.payments && selectedTrip.payments.length > 0 ? (
                        selectedTrip.payments.map((payment) => (
                          <Box key={payment.id} p={4} borderWidth="1px" borderColor="gray.200" borderRadius="lg" mb={3}>
                            <Flex justify="space-between" mb={2}>
                              <Text fontWeight="medium">Payment #{payment.id.slice(0, 8)}</Text>
                              <Badge
                                colorScheme={payment.status === 'completed' ? 'green' : 'orange'}
                                variant="subtle"
                              >
                                {payment.status}
                              </Badge>
                            </Flex>
                            <Text fontSize="lg" fontWeight="bold">
                              {formatCurrency(payment.amount)}
                            </Text>
                          </Box>
                        ))
                      ) : (
                        <Text color="gray.500">No payment information</Text>
                      )}
                    </TabPanel>

                    <TabPanel>
                      <VStack spacing={4} align="stretch">
                        <Button
                          leftIcon={<FaPhone />}
                          colorScheme="blue"
                          onClick={() => alert(`Calling passenger: ${selectedTrip.passenger?.phone}`)}
                        >
                          Call Passenger
                        </Button>
                        
                        {selectedTrip.driver && (
                          <Button
                            leftIcon={<FaPhone />}
                            colorScheme="blue"
                            variant="outline"
                            onClick={() => alert(`Calling driver: ${selectedTrip.driver?.phone}`)}
                          >
                            Call Driver
                          </Button>
                        )}

                        {['requested', 'assigned', 'driver_arriving', 'in_progress'].includes(selectedTrip.status) && (
                          <>
                            <Button
                              leftIcon={<FaRoute />}
                              colorScheme="green"
                              onClick={() => {
                                onClose();
                                handleReassign(selectedTrip);
                              }}
                            >
                              Reassign Driver
                            </Button>
                            
                            <Button
                              leftIcon={<FaBan />}
                              colorScheme="red"
                              onClick={() => {
                                onClose();
                                handleCancelTrip(selectedTrip);
                              }}
                            >
                              Cancel Trip
                            </Button>
                          </>
                        )}

                        <Button
                          leftIcon={<FaExclamationTriangle />}
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleEmergencyAction(selectedTrip, 'report_emergency')}
                        >
                          Report Emergency
                        </Button>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Cancel Trip Modal */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cancel Trip</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Warning: Trip Cancellation</AlertTitle>
                <AlertDescription>
                  This action will cancel the trip and notify both passenger and driver.
                </AlertDescription>
              </Box>
            </Alert>
            <FormControl>
              <FormLabel>Reason for Cancellation</FormLabel>
              <Textarea
                placeholder="Enter reason for cancelling this trip..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                minH="100px"
                required
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCancelClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmCancel}>
              Cancel Trip
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reassign Driver Modal */}
      <Modal isOpen={isReassignOpen} onClose={onReassignClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reassign Driver</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedTrip && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Current driver: <strong>{selectedTrip.driver?.full_name || 'Unassigned'}</strong>
                </Text>
                
                <FormControl>
                  <FormLabel>Select New Driver</FormLabel>
                  <Select
                    placeholder="Choose a driver..."
                    value={reassignDriverId}
                    onChange={(e) => setReassignDriverId(e.target.value)}
                  >
                    {availableDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name} ({driver.vehicle_number}) - Rating: {driver.rating?.toFixed(1) || 'N/A'}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {availableDrivers.length === 0 && (
                  <Alert status="info">
                    <AlertIcon />
                    <Text>No drivers are currently available online.</Text>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReassignClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={confirmReassign}
              isDisabled={!reassignDriverId}
            >
              Reassign Driver
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default LiveTrips;