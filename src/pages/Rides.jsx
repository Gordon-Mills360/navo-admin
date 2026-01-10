import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import RideCard from '../components/RideCard';
import { 
  formatCurrency,
  formatDate
} from '../utils/helpers';
import PageContainer from '../components/PageContainer';
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Button,
  Select,
  SimpleGrid,
  Badge,
  useToast,
  Spinner,
  Icon,
  Card,
  CardBody,
  Input,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
} from '@chakra-ui/react';
import {
  FaTruck,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaSyncAlt,
  FaSearch,
  FaFilter,
  FaDollarSign,
  FaRoute,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';

const Rides = () => {
  const [rides, setRides] = useState([]);
  const [filteredRides, setFilteredRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    requested: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    active: 0,
    averageFare: 0
  });

  const toast = useToast();

  const fetchRides = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      // Build safe query that matches your exact schema
      const { data, error: fetchError } = await supabase
        .from('rides')
        .select(`
          id,
          status,
          payment_status,
          fare,
          fare_amount,
          actual_fare,
          pickup_location,
          dropoff_location,
          distance_km,
          duration_min,
          city,
          commission,
          driver_payout,
          payment_id,
          cancellation_reason,
          notes,
          created_at,
          updated_at,
          accepted_at,
          arrived_at,
          started_at,
          completed_at,
          cancelled_at,
          passenger_id,
          driver_id,
          passenger:passenger_id (
            id,
            full_name,
            phone,
            email
          ),
          driver:driver_id (
            id,
            full_name,
            phone,
            vehicle_number
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        // Try simpler query without joins first
        const { data: simpleData, error: simpleError } = await supabase
          .from('rides')
          .select('id, status, fare, created_at, passenger_id, driver_id')
          .order('created_at', { ascending: false });
          
        if (simpleError) {
          throw new Error(`Failed to fetch rides: ${simpleError.message}`);
        }
        
        // If we got simple data, fetch user details separately
        const ridesWithDetails = await Promise.all(
          (simpleData || []).map(async (ride) => {
            let passenger = null;
            let driver = null;
            
            // Fetch passenger details
            if (ride.passenger_id) {
              const { data: passengerData } = await supabase
                .from('profiles')
                .select('id, full_name, phone, email')
                .eq('id', ride.passenger_id)
                .single();
              passenger = passengerData;
            }
            
            // Fetch driver details
            if (ride.driver_id) {
              const { data: driverData } = await supabase
                .from('profiles')
                .select('id, full_name, phone, vehicle_number')
                .eq('id', ride.driver_id)
                .single();
              driver = driverData;
            }
            
            return {
              ...ride,
              passenger,
              driver
            };
          })
        );
        
        setRides(ridesWithDetails);
        calculateStats(ridesWithDetails);
        return;
      }

      setRides(data || []);
      calculateStats(data || []);
      
    } catch (error) {
      console.error('Error fetching rides:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRides();
    
    // Real-time subscription for ride changes
    const ridesSubscription = supabase
      .channel('rides_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rides' 
        }, 
        () => {
          fetchRides();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ridesSubscription);
    };
  }, [fetchRides]);

  const calculateStats = (ridesData) => {
    const total = ridesData.length;
    const requested = ridesData.filter(r => r.status === 'requested').length;
    const ongoing = ridesData.filter(r => 
      ['ongoing', 'in_progress', 'started', 'accepted', 'arrived'].includes(r.status)
    ).length;
    const completed = ridesData.filter(r => 
      r.status === 'completed' || r.status === 'PAID'
    ).length;
    const cancelled = ridesData.filter(r => r.status === 'cancelled').length;
    const active = ridesData.filter(r => 
      ['requested', 'accepted', 'arrived', 'started', 'ongoing', 'in_progress'].includes(r.status)
    ).length;
    
    const completedRides = ridesData.filter(r => 
      r.status === 'completed' || r.status === 'PAID'
    );
    
    const totalRevenue = completedRides.reduce((sum, ride) => 
      sum + (ride.actual_fare || ride.fare || ride.fare_amount || 0), 0
    );
    
    const averageFare = completedRides.length > 0 
      ? totalRevenue / completedRides.length 
      : 0;

    setStats({
      total,
      requested,
      ongoing,
      completed,
      cancelled,
      active,
      totalRevenue,
      averageFare
    });
  };

  useEffect(() => {
    let filtered = [...rides];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(ride => 
          ['requested', 'accepted', 'arrived', 'started', 'ongoing', 'in_progress'].includes(ride.status)
        );
      } else {
        filtered = filtered.filter(ride => ride.status === statusFilter);
      }
    }
    
    // Apply date filter
    const now = new Date();
    if (dateFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(ride => new Date(ride.created_at) >= today);
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(ride => new Date(ride.created_at) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter(ride => new Date(ride.created_at) >= monthAgo);
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ride => {
        const passengerName = ride.passenger?.full_name || '';
        const driverName = ride.driver?.full_name || '';
        const pickupLocation = ride.pickup_location || '';
        const dropoffLocation = ride.dropoff_location || '';
        const rideId = ride.id || '';
        const passengerPhone = ride.passenger?.phone || '';
        
        return (
          passengerName.toLowerCase().includes(term) ||
          driverName.toLowerCase().includes(term) ||
          pickupLocation.toLowerCase().includes(term) ||
          dropoffLocation.toLowerCase().includes(term) ||
          rideId.toLowerCase().includes(term) ||
          passengerPhone.toLowerCase().includes(term)
        );
      });
    }
    
    setFilteredRides(filtered);
  }, [rides, statusFilter, dateFilter, searchTerm]);

  const handleRefresh = () => {
    fetchRides();
    toast({
      title: 'Refreshing',
      description: 'Rides data is being refreshed',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleStatusUpdate = (updatedRide) => {
    setRides(prev => prev.map(r => r.id === updatedRide.id ? updatedRide : r));
  };

  const getStatusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'green';
      case 'accepted':
      case 'arrived':
      case 'started':
      case 'ongoing':
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
      'ongoing': 'Ride Ongoing',
      'in_progress': 'In Progress',
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
            leftIcon={<FaSyncAlt />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            Retry
          </Button>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Rides Management"
      subtitle="View and manage all tricycle rides"
      action={
        <Button
          leftIcon={<FaSyncAlt />}
          size="sm"
          onClick={handleRefresh}
          isLoading={refreshing}
          variant="outline"
        >
          Refresh
        </Button>
      }
    >
      {/* Stats Cards */}
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
              <StatLabel fontSize="xs" color="gray.600">Active</StatLabel>
              <StatNumber fontSize="xl" color="blue.500">{stats.active}</StatNumber>
              <StatHelpText fontSize="xs">
                {stats.requested} requested
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
                {stats.ongoing} ongoing
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
              <StatNumber fontSize="xl">{formatCurrency(stats.totalRevenue)}</StatNumber>
              <StatHelpText fontSize="xs">
                From {stats.completed} rides
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Avg Fare</StatLabel>
              <StatNumber fontSize="xl">{formatCurrency(stats.averageFare)}</StatNumber>
              <Progress 
                value={stats.averageFare > 0 ? Math.min((stats.averageFare / 50) * 100, 100) : 0} 
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
          <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr auto' }} gap={4} alignItems="center">
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
                <option value="ongoing">Ongoing</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </GridItem>
            
            <GridItem>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                bg="white"
                leftIcon={<FaCalendarAlt />}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </Select>
            </GridItem>
            
            <GridItem>
              <Button
                leftIcon={<FaSyncAlt />}
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
              Total: {filteredRides.length} rides
            </Badge>
            <Badge colorScheme="green" px={3} py={1}>
              Completed: {filteredRides.filter(r => r.status === 'completed' || r.status === 'PAID').length}
            </Badge>
            <Badge colorScheme="blue" px={3} py={1}>
              Active: {filteredRides.filter(r => ['requested', 'accepted', 'arrived', 'started', 'ongoing', 'in_progress'].includes(r.status)).length}
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
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {filteredRides.map((ride) => (
            <RideCard
              key={ride.id}
              ride={ride}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </VStack>
      )}

      {/* Summary Footer */}
      {!loading && filteredRides.length > 0 && (
        <Card mt={4}>
          <CardBody>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500">
                  Showing {filteredRides.length} of {rides.length} rides
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Last updated: {formatDate(new Date().toISOString())}
                </Text>
              </VStack>
              <Badge colorScheme="green" px={3} py={1}>
                Real-time updates active
              </Badge>
            </Flex>
          </CardBody>
        </Card>
      )}
    </PageContainer>
  );
};

export default Rides;