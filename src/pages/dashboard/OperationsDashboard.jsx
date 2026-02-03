import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Heading,
  Icon,
  Badge,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FaMotorcycle,
  FaUserFriends,
  FaUsers,
  FaMapMarkerAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSync,
  FaEye,
  FaPhone,
  FaBan,
  FaRedo,
  FaEllipsisV,
  FaMap,
  FaRoute,
  FaCar,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useRealTime } from '../../contexts/RealTimeContext';
import { useTripManagement } from '../../hooks/useTripManagement';
import { supabase } from '../../services/supabase';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/shared/StatCard';
import DataTable from '../../components/shared/DataTable';

const OperationsDashboard = () => {
  const { admin } = useAuth();
  const { realTimeData, refreshData } = useRealTime();
  const { forceCancelTrip, handleEmergency } = useTripManagement();
  const [liveTrips, setLiveTrips] = useState([]);
  const [liveDrivers, setLiveDrivers] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchOperationsData = async () => {
    try {
      setLoading(true);
      
      const [tripsRes, driversRes, emergenciesRes] = await Promise.all([
        supabase
          .from('trips')
          .select(`
            *,
            passenger:passenger_id (full_name, phone),
            driver:driver_id (full_name, phone, vehicle_number)
          `)
          .in('status', ['requested', 'assigned', 'driver_arriving', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('drivers')
          .select(`
            *,
            vehicle:vehicle_id (model, color, license_plate)
          `)
          .eq('status', 'online')
          .order('last_active', { ascending: false })
          .limit(20),
        
        supabase
          .from('emergencies')
          .select(`
            *,
            trip:trip_id (id, passenger_id, driver_id)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setLiveTrips(tripsRes.data || []);
      setLiveDrivers(driversRes.data || []);
      setEmergencies(emergenciesRes.data || []);
      
      await refreshData();
    } catch (error) {
      console.error('Error fetching operations data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();

    const subscriptions = [
      supabase
        .channel('operations_trips')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchOperationsData)
        .subscribe(),
      
      supabase
        .channel('operations_drivers')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, fetchOperationsData)
        .subscribe(),
      
      supabase
        .channel('operations_emergencies')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, fetchOperationsData)
        .subscribe(),
    ];

    return () => {
      subscriptions.forEach(sub => supabase.removeChannel(sub));
    };
  }, []);

  const handleCancelTrip = async (tripId) => {
    if (window.confirm('Are you sure you want to cancel this trip?')) {
      await forceCancelTrip(tripId, 'Cancelled by operations admin', admin.id);
      fetchOperationsData();
    }
  };

  const handleEmergencyAction = async (emergencyId, action) => {
    const emergency = emergencies.find(e => e.id === emergencyId);
    if (!emergency) return;

    switch (action) {
      case 'call_driver':
        // Implement call driver
        alert(`Calling driver for emergency ${emergencyId}`);
        break;
      case 'call_passenger':
        // Implement call passenger
        alert(`Calling passenger for emergency ${emergencyId}`);
        break;
      case 'cancel_trip':
        await handleEmergency(
          emergency.trip_id,
          emergency.emergency_type,
          {
            description: 'Emergency handled by operations',
            actions: ['cancel_trip']
          },
          admin.id
        );
        break;
    }
  };

  const getTripStatusColor = (status) => {
    switch (status) {
      case 'in_progress': return 'green';
      case 'driver_arriving': return 'blue';
      case 'assigned': return 'yellow';
      case 'requested': return 'orange';
      default: return 'gray';
    }
  };

  const formatDuration = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = Math.floor((now - start) / 60000); // minutes
    return `${diff} min`;
  };

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Operations Dashboard
            </Heading>
            <Text color="gray.600" mt={1}>
              Real-time trip and driver monitoring
            </Text>
          </Box>
          <HStack spacing={3}>
            <Button
              leftIcon={<FaSync />}
              onClick={fetchOperationsData}
              isLoading={loading}
              size="sm"
              variant="outline"
            >
              Refresh
            </Button>
            <Button
              leftIcon={<FaMap />}
              colorScheme="brand"
              size="sm"
            >
              Live Map
            </Button>
          </HStack>
        </Flex>

        {/* Emergency Alerts */}
        {emergencies.length > 0 && (
          <Alert status="error" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Active Emergencies</AlertTitle>
              <AlertDescription>
                {emergencies.length} emergency situation(s) require immediate attention
              </AlertDescription>
            </Box>
            <Button
              colorScheme="red"
              size="sm"
              leftIcon={<FaExclamationTriangle />}
              onClick={() => window.location.href = '/operations/emergencies'}
            >
              View All
            </Button>
          </Alert>
        )}

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Active Trips"
            value={liveTrips.length.toString()}
            icon={FaMotorcycle}
            color="blue"
            change={`${realTimeData.activeTrips || 0} total active`}
            trend="up"
          />
          
          <StatCard
            title="Online Drivers"
            value={liveDrivers.length.toString()}
            icon={FaUserFriends}
            color="green"
            change={`${realTimeData.onlineDrivers || 0} total online`}
            trend="up"
          />
          
          <StatCard
            title="Avg Response Time"
            value="2.4 min"
            icon={FaClock}
            color="purple"
            change="Driver to passenger"
            trend="down"
          />
          
          <StatCard
            title="Success Rate"
            value="99.2%"
            icon={FaCheckCircle}
            color="teal"
            change="Trip completion"
            trend="up"
          />
        </SimpleGrid>

        {/* Live Trips Table */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={3}>
            <Flex justify="space-between" align="center">
              <Heading size="md">Live Trips</Heading>
              <Badge colorScheme="blue" variant="subtle">
                Real-time
              </Badge>
            </Flex>
          </CardHeader>
          <CardBody pt={0} px={0}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Trip ID</Th>
                    <Th>Passenger</Th>
                    <Th>Driver</Th>
                    <Th>Status</Th>
                    <Th>Duration</Th>
                    <Th>Location</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {liveTrips.map((trip) => (
                    <Tr key={trip.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <Text fontFamily="mono" fontSize="xs">
                          {trip.id.slice(0, 8)}...
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="medium">
                          {trip.passenger?.full_name || 'N/A'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {trip.passenger?.phone || 'No phone'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="medium">
                          {trip.driver?.full_name || 'Unassigned'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {trip.driver?.vehicle_number || 'No vehicle'}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getTripStatusColor(trip.status)}
                          variant="subtle"
                          fontSize="xs"
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          {trip.status.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {formatDuration(trip.created_at)}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.600" noOfLines={1}>
                          {trip.pickup_location?.slice(0, 30)}...
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <Tooltip label="View Details">
                            <IconButton
                              icon={<FaEye />}
                              size="xs"
                              variant="ghost"
                              aria-label="View trip"
                            />
                          </Tooltip>
                          <Tooltip label="Call Passenger">
                            <IconButton
                              icon={<FaPhone />}
                              size="xs"
                              variant="ghost"
                              aria-label="Call passenger"
                            />
                          </Tooltip>
                          <Tooltip label="Cancel Trip">
                            <IconButton
                              icon={<FaBan />}
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              aria-label="Cancel trip"
                              onClick={() => handleCancelTrip(trip.id)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
          <CardFooter pt={0}>
            <Button
              leftIcon={<FaRoute />}
              variant="ghost"
              size="sm"
              w="100%"
              onClick={() => window.location.href = '/operations/live-trips'}
            >
              View All Trips
            </Button>
          </CardFooter>
        </Card>

        {/* Live Drivers & Emergencies Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Live Drivers */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Heading size="md">Online Drivers</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {liveDrivers.slice(0, 5).map((driver) => (
                  <Flex
                    key={driver.id}
                    justify="space-between"
                    align="center"
                    p={3}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.200"
                    _hover={{ bg: 'gray.50' }}
                  >
                    <HStack spacing={3}>
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg="green.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FaCar} color="green.600" />
                      </Box>
                      <Box>
                        <Text fontWeight="medium" fontSize="sm">
                          {driver.full_name}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {driver.vehicle?.license_plate || 'No vehicle'}
                        </Text>
                      </Box>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {driver.last_active ? formatDuration(driver.last_active) : 'Unknown'}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaUserFriends />}
                variant="ghost"
                size="sm"
                w="100%"
                onClick={() => window.location.href = '/operations/live-drivers'}
              >
                View All Drivers
              </Button>
            </CardFooter>
          </Card>

          {/* Active Emergencies */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Active Emergencies</Heading>
                {emergencies.length > 0 && (
                  <Badge colorScheme="red" variant="solid">
                    {emergencies.length}
                  </Badge>
                )}
              </Flex>
            </CardHeader>
            <CardBody>
              {emergencies.length === 0 ? (
                <Box textAlign="center" py={8} color="gray.500">
                  <Icon as={FaCheckCircle} boxSize={8} mb={3} opacity={0.5} />
                  <Text>No active emergencies</Text>
                </Box>
              ) : (
                <VStack spacing={3} align="stretch">
                  {emergencies.slice(0, 3).map((emergency) => (
                    <Box
                      key={emergency.id}
                      p={3}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor="red.200"
                      bg="red.50"
                    >
                      <Flex justify="space-between" align="start" mb={2}>
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" color="red.800">
                            {emergency.emergency_type.replace('_', ' ')}
                          </Text>
                          <Text fontSize="xs" color="red.600">
                            Trip: {emergency.trip_id?.slice(0, 8)}...
                          </Text>
                        </Box>
                        <Badge colorScheme="red" fontSize="xs">
                          {emergency.priority}
                        </Badge>
                      </Flex>
                      <Text fontSize="xs" color="gray.700" mb={3}>
                        {emergency.description?.slice(0, 100)}...
                      </Text>
                      <HStack spacing={2}>
                        <Button
                          size="xs"
                          leftIcon={<FaPhone />}
                          colorScheme="red"
                          variant="solid"
                          onClick={() => handleEmergencyAction(emergency.id, 'call_driver')}
                        >
                          Call Driver
                        </Button>
                        <Button
                          size="xs"
                          leftIcon={<FaPhone />}
                          colorScheme="red"
                          variant="outline"
                          onClick={() => handleEmergencyAction(emergency.id, 'call_passenger')}
                        >
                          Call Passenger
                        </Button>
                        <Button
                          size="xs"
                          leftIcon={<FaBan />}
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleEmergencyAction(emergency.id, 'cancel_trip')}
                        >
                          Cancel Trip
                        </Button>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaExclamationTriangle />}
                variant="ghost"
                size="sm"
                w="100%"
                colorScheme="red"
                onClick={() => window.location.href = '/operations/emergencies'}
              >
                {emergencies.length > 0 ? 'Handle All Emergencies' : 'Emergency Dashboard'}
              </Button>
            </CardFooter>
          </Card>
        </SimpleGrid>

        {/* Performance Metrics */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <CardHeader pb={3}>
            <Heading size="md">Performance Metrics</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Driver Acceptance Rate
                </Text>
                <Progress value={92} colorScheme="green" size="lg" borderRadius="full" />
                <Text fontSize="sm" fontWeight="medium" mt={2}>
                  92%
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Passenger Cancellation Rate
                </Text>
                <Progress value={15} colorScheme="orange" size="lg" borderRadius="full" />
                <Text fontSize="sm" fontWeight="medium" mt={2}>
                  15%
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Average Rating
                </Text>
                <Progress value={4.7 * 20} colorScheme="blue" size="lg" borderRadius="full" />
                <Text fontSize="sm" fontWeight="medium" mt={2}>
                  4.7/5
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.600" mb={2}>
                  On-time Performance
                </Text>
                <Progress value={88} colorScheme="teal" size="lg" borderRadius="full" />
                <Text fontSize="sm" fontWeight="medium" mt={2}>
                  88%
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  );
};

export default OperationsDashboard;