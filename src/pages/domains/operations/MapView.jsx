import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Spinner,
  Alert,
  AlertIcon,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Switch,
  FormControl,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
  Divider,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';
import {
  SearchIcon,
  RepeatIcon,
  ViewIcon,
  LocationIcon,
  SettingsIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FilterIcon,
} from '@chakra-ui/icons';
import { FaCar, FaUser, FaMapMarkerAlt, FaRoute, FaLayerGroup } from 'react-icons/fa';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useRealTime } from '../../contexts/RealTimeContext';
import useTripManagement from '../../hooks/useTripManagement';
import useUserManagement from '../../hooks/useUserManagement';

// Note: In a real implementation, you would use Google Maps or Mapbox
// For this example, we'll create a simulated map view with data visualization

const MapView = () => {
  const { user } = useAuth();
  const { subscribeToTable, unsubscribe } = useRealTime();
  const { getLiveTrips } = useTripManagement();
  const { getOnlineDrivers } = useUserManagement();
  
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [mapLayers, setMapLayers] = useState({
    drivers: true,
    trips: true,
    heatmap: false,
    traffic: true,
  });
  const [zoomLevel, setZoomLevel] = useState(12);
  const [mapType, setMapType] = useState('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch online drivers
      const { data: driversData, error: driversError } = await getOnlineDrivers();
      if (driversError) throw driversError;
      
      // Fetch live trips
      const { data: tripsData, error: tripsError } = await getLiveTrips();
      if (tripsError) throw tripsError;
      
      setDrivers(driversData || []);
      setTrips(tripsData || []);
      
    } catch (err) {
      console.error('Error fetching map data:', err);
      setError('Failed to load map data');
      toast({
        title: 'Error',
        description: 'Failed to load map data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getOnlineDrivers, getLiveTrips, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    const subscriptions = [];
    
    // Subscribe to driver updates
    const driverSubscription = subscribeToTable('drivers', (payload) => {
      if (payload.new.current_status === 'online') {
        setDrivers(prev => {
          const index = prev.findIndex(d => d.id === payload.new.id);
          if (index !== -1) {
            const newDrivers = [...prev];
            newDrivers[index] = { ...newDrivers[index], ...payload.new };
            return newDrivers;
          }
          return [...prev, payload.new];
        });
      } else {
        setDrivers(prev => prev.filter(d => d.id !== payload.new.id));
      }
    });
    subscriptions.push(driverSubscription);
    
    // Subscribe to trip updates
    const tripSubscription = subscribeToTable('trips', (payload) => {
      if (payload.new.status === 'active' || payload.new.status === 'in_progress') {
        setTrips(prev => {
          const index = prev.findIndex(t => t.id === payload.new.id);
          if (index !== -1) {
            const newTrips = [...prev];
            newTrips[index] = { ...newTrips[index], ...payload.new };
            return newTrips;
          }
          return [...prev, payload.new];
        });
      } else {
        setTrips(prev => prev.filter(t => t.id !== payload.new.id));
      }
    });
    subscriptions.push(tripSubscription);

    return () => {
      subscriptions.forEach(sub => unsubscribe(sub));
    };
  }, [subscribeToTable, unsubscribe]);

  // Auto-refresh interval
  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchData();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle driver selection
  const handleSelectDriver = (driver) => {
    setSelectedDriver(driver);
    setSelectedTrip(null);
  };

  // Handle trip selection
  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setSelectedDriver(null);
  };

  // Toggle map layers
  const toggleLayer = (layer) => {
    setMapLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // Generate simulated map data
  const generateSimulatedMap = () => {
    return (
      <Box 
        position="relative" 
        width="100%" 
        height="600px" 
        bg="gray.100" 
        borderRadius="lg"
        overflow="hidden"
        border="1px solid"
        borderColor="gray.200"
      >
        {/* Simulated map background */}
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bg="blue.50"
          backgroundImage="radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.1) 1px, transparent 0)"
          backgroundSize="40px 40px"
        />
        
        {/* Simulated roads */}
        <Box
          position="absolute"
          top="50%"
          left="10%"
          width="80%"
          height="4px"
          bg="gray.400"
          transform="translateY(-50%)"
        />
        <Box
          position="absolute"
          top="30%"
          left="20%"
          width="4px"
          height="40%"
          bg="gray.400"
        />
        
        {/* Plot drivers on map */}
        {mapLayers.drivers && drivers.slice(0, 20).map((driver, index) => {
          // Simulate positions
          const x = 10 + (index % 10) * 8;
          const y = 20 + Math.floor(index / 10) * 15;
          
          return (
            <Tooltip
              key={driver.id}
              label={`${driver.full_name} - ${driver.current_status}`}
              placement="top"
            >
              <Box
                position="absolute"
                left={`${x}%`}
                top={`${y}%`}
                cursor="pointer"
                onClick={() => handleSelectDriver(driver)}
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.2)' }}
              >
                <Box
                  width="24px"
                  height="24px"
                  bg={driver.current_trip_id ? 'purple.500' : 'green.500'}
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="12px"
                  boxShadow="md"
                  border="2px solid white"
                >
                  <FaCar />
                </Box>
                {selectedDriver?.id === driver.id && (
                  <Box
                    position="absolute"
                    top="100%"
                    left="50%"
                    transform="translateX(-50%)"
                    mt={1}
                    bg="white"
                    p={2}
                    borderRadius="md"
                    boxShadow="lg"
                    minWidth="200px"
                    zIndex={10}
                  >
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">{driver.full_name}</Text>
                      <Text fontSize="sm">{driver.vehicle?.plate_number}</Text>
                      <Badge colorScheme={driver.current_trip_id ? 'purple' : 'green'}>
                        {driver.current_trip_id ? 'On Trip' : 'Available'}
                      </Badge>
                    </VStack>
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
        
        {/* Plot trips on map */}
        {mapLayers.trips && trips.slice(0, 15).map((trip, index) => {
          // Simulate positions
          const x = 15 + (index % 8) * 10;
          const y = 60 + Math.floor(index / 8) * 10;
          
          return (
            <Tooltip
              key={trip.id}
              label={`Trip #${trip.trip_code} - ${trip.status}`}
              placement="top"
            >
              <Box
                position="absolute"
                left={`${x}%`}
                top={`${y}%`}
                cursor="pointer"
                onClick={() => handleSelectTrip(trip)}
                transition="all 0.2s"
                _hover={{ transform: 'scale(1.2)' }}
              >
                <Box
                  width="20px"
                  height="20px"
                  bg="blue.500"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="10px"
                  boxShadow="md"
                  border="2px solid white"
                >
                  <FaRoute />
                </Box>
                {selectedTrip?.id === trip.id && (
                  <Box
                    position="absolute"
                    top="100%"
                    left="50%"
                    transform="translateX(-50%)"
                    mt={1}
                    bg="white"
                    p={2}
                    borderRadius="md"
                    boxShadow="lg"
                    minWidth="200px"
                    zIndex={10}
                  >
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">Trip #{trip.trip_code}</Text>
                      <Text fontSize="sm">From: {trip.pickup_location?.substring(0, 20)}...</Text>
                      <Text fontSize="sm">To: {trip.dropoff_location?.substring(0, 20)}...</Text>
                      <Badge colorScheme="blue">{trip.status}</Badge>
                    </VStack>
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
        
        {/* Simulated heatmap overlay */}
        {mapLayers.heatmap && (
          <Box
            position="absolute"
            top="40%"
            left="60%"
            width="30%"
            height="40%"
            bg="red.500"
            opacity="0.3"
            borderRadius="full"
            filter="blur(20px)"
          />
        )}
        
        {/* Map controls overlay */}
        <Box
          position="absolute"
          top={4}
          right={4}
          bg="white"
          p={3}
          borderRadius="md"
          boxShadow="lg"
          zIndex={10}
        >
          <VStack spacing={2} align="start">
            <Button
              size="sm"
              onClick={() => setZoomLevel(prev => Math.min(prev + 2, 20))}
              leftIcon={<ChevronUpIcon />}
            >
              Zoom In
            </Button>
            <Button
              size="sm"
              onClick={() => setZoomLevel(prev => Math.max(prev - 2, 1))}
              leftIcon={<ChevronDownIcon />}
            >
              Zoom Out
            </Button>
            <Divider />
            <Text fontSize="sm" fontWeight="medium">
              Zoom: {zoomLevel}x
            </Text>
          </VStack>
        </Box>
        
        {/* Legend */}
        <Box
          position="absolute"
          bottom={4}
          left={4}
          bg="white"
          p={3}
          borderRadius="md"
          boxShadow="lg"
          zIndex={10}
        >
          <VStack spacing={2} align="start">
            <Text fontSize="sm" fontWeight="bold">Legend</Text>
            <HStack>
              <Box width="12px" height="12px" bg="green.500" borderRadius="full" />
              <Text fontSize="xs">Available Driver</Text>
            </HStack>
            <HStack>
              <Box width="12px" height="12px" bg="purple.500" borderRadius="full" />
              <Text fontSize="xs">Driver on Trip</Text>
            </HStack>
            <HStack>
              <Box width="12px" height="12px" bg="blue.500" borderRadius="full" />
              <Text fontSize="xs">Active Trip</Text>
            </HStack>
          </VStack>
        </Box>
      </Box>
    );
  };

  // Filtered data based on search
  const filteredDrivers = drivers.filter(driver =>
    driver.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.vehicle?.plate_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTrips = trips.filter(trip =>
    trip.trip_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.passenger_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && drivers.length === 0 && trips.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading map data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load map</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchData} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">Real-Time Map View</Heading>
          <Text color="gray.600" mt={1}>
            Live visualization of drivers and trips
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchData}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
          <Button colorScheme="blue" leftIcon={<SettingsIcon />}>
            Map Settings
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={6}>
        {/* Sidebar Controls */}
        <Box>
          <Card mb={4}>
            <CardHeader pb={2}>
              <Heading size="md">Map Controls</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Search */}
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search drivers or trips..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>

                {/* Map Type */}
                <Box>
                  <FormLabel fontSize="sm">Map Type</FormLabel>
                  <Select
                    value={mapType}
                    onChange={(e) => setMapType(e.target.value)}
                    size="sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="satellite">Satellite</option>
                    <option value="terrain">Terrain</option>
                    <option value="dark">Dark Mode</option>
                  </Select>
                </Box>

                {/* Layers Toggle */}
                <Box>
                  <FormLabel fontSize="sm">Map Layers</FormLabel>
                  <VStack align="start" spacing={2}>
                    <FormControl display="flex" alignItems="center">
                      <Switch
                        isChecked={mapLayers.drivers}
                        onChange={() => toggleLayer('drivers')}
                        mr={3}
                      />
                      <FormLabel mb={0} fontSize="sm">Show Drivers</FormLabel>
                      <Badge ml={2} colorScheme="green">
                        {drivers.length}
                      </Badge>
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <Switch
                        isChecked={mapLayers.trips}
                        onChange={() => toggleLayer('trips')}
                        mr={3}
                      />
                      <FormLabel mb={0} fontSize="sm">Show Trips</FormLabel>
                      <Badge ml={2} colorScheme="blue">
                        {trips.length}
                      </Badge>
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <Switch
                        isChecked={mapLayers.heatmap}
                        onChange={() => toggleLayer('heatmap')}
                        mr={3}
                      />
                      <FormLabel mb={0} fontSize="sm">Demand Heatmap</FormLabel>
                    </FormControl>
                    <FormControl display="flex" alignItems="center">
                      <Switch
                        isChecked={mapLayers.traffic}
                        onChange={() => toggleLayer('traffic')}
                        mr={3}
                      />
                      <FormLabel mb={0} fontSize="sm">Traffic Data</FormLabel>
                    </FormControl>
                  </VStack>
                </Box>

                {/* Auto Refresh */}
                <FormControl display="flex" alignItems="center">
                  <Switch
                    isChecked={autoRefresh}
                    onChange={() => setAutoRefresh(!autoRefresh)}
                    mr={3}
                  />
                  <FormLabel mb={0} fontSize="sm">Auto Refresh (30s)</FormLabel>
                </FormControl>

                {/* Zoom Control */}
                <Box>
                  <FormLabel fontSize="sm">Zoom Level</FormLabel>
                  <Slider
                    value={zoomLevel}
                    onChange={setZoomLevel}
                    min={1}
                    max={20}
                    step={1}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                  </Slider>
                  <Text fontSize="sm" textAlign="center" mt={2}>
                    {zoomLevel}x Zoom
                  </Text>
                </Box>
              </VStack>
            </CardBody>
          </Card>

          {/* Live Stats */}
          <Card>
            <CardHeader pb={2}>
              <Heading size="md">Live Statistics</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={2} spacing={3}>
                <Box>
                  <Text fontSize="sm" color="gray.600">Online Drivers</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {drivers.length}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Active Trips</Text>
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    {trips.length}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Available</Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {drivers.filter(d => !d.current_trip_id).length}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">On Trips</Text>
                  <Text fontSize="xl" fontWeight="bold" color="purple.600">
                    {drivers.filter(d => d.current_trip_id).length}
                  </Text>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        </Box>

        {/* Main Map Area - 3 columns wide */}
        <Box gridColumn={{ base: 1, lg: '2 / span 3' }}>
          <Card mb={4}>
            <CardBody p={0}>
              {generateSimulatedMap()}
            </CardBody>
          </Card>

          {/* Data Tables */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {/* Online Drivers Table */}
            <Card>
              <CardHeader pb={2}>
                <Heading size="sm">Online Drivers ({filteredDrivers.length})</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Box maxH="300px" overflowY="auto">
                  {filteredDrivers.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No drivers found
                    </Text>
                  ) : (
                    filteredDrivers.slice(0, 10).map(driver => (
                      <Box
                        key={driver.id}
                        p={3}
                        mb={2}
                        borderWidth="1px"
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => handleSelectDriver(driver)}
                        bg={selectedDriver?.id === driver.id ? 'blue.50' : 'white'}
                        borderColor={selectedDriver?.id === driver.id ? 'blue.200' : 'gray.200'}
                        _hover={{ bg: 'gray.50' }}
                      >
                        <HStack justify="space-between">
                          <HStack>
                            <Box color={driver.current_trip_id ? 'purple.500' : 'green.500'}>
                              <FaCar />
                            </Box>
                            <Box>
                              <Text fontWeight="medium">{driver.full_name}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {driver.vehicle?.plate_number}
                              </Text>
                            </Box>
                          </HStack>
                          <Badge colorScheme={driver.current_trip_id ? 'purple' : 'green'}>
                            {driver.current_trip_id ? 'On Trip' : 'Available'}
                          </Badge>
                        </HStack>
                      </Box>
                    ))
                  )}
                </Box>
              </CardBody>
            </Card>

            {/* Active Trips Table */}
            <Card>
              <CardHeader pb={2}>
                <Heading size="sm">Active Trips ({filteredTrips.length})</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Box maxH="300px" overflowY="auto">
                  {filteredTrips.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No trips found
                    </Text>
                  ) : (
                    filteredTrips.slice(0, 10).map(trip => (
                      <Box
                        key={trip.id}
                        p={3}
                        mb={2}
                        borderWidth="1px"
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => handleSelectTrip(trip)}
                        bg={selectedTrip?.id === trip.id ? 'blue.50' : 'white'}
                        borderColor={selectedTrip?.id === trip.id ? 'blue.200' : 'gray.200'}
                        _hover={{ bg: 'gray.50' }}
                      >
                        <HStack justify="space-between">
                          <Box>
                            <Text fontWeight="medium">Trip #{trip.trip_code}</Text>
                            <Text fontSize="sm" color="gray.500" isTruncated>
                              {trip.pickup_location?.substring(0, 30)}...
                            </Text>
                          </Box>
                          <Badge colorScheme="blue">{trip.status}</Badge>
                        </HStack>
                      </Box>
                    ))
                  )}
                </Box>
              </CardBody>
            </Card>
          </SimpleGrid>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default MapView;