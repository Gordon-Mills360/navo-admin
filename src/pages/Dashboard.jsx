import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { 
  formatCurrency, 
  formatNumber, 
  calculatePercentage,
  formatDate
} from '../utils/helpers';
import AnalyticsChart from '../components/AnalyticsChart';
import StatCard from '../components/StatCard';
import PageContainer from '../components/PageContainer';
import {
  Box,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Divider,
  Badge,
  Flex,
  Spinner,
  Icon,
  Progress,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  useToast,
  Skeleton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip
} from '@chakra-ui/react';
import {
  FaUsers,
  FaUserFriends,
  FaMotorcycle,
  FaDollarSign,
  FaCheckCircle,
  FaChartLine,
  FaRoute,
  FaUserPlus,
  FaUser,
  FaExclamationTriangle,
  FaRedo,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaStar,
  FaPercentage,
  FaDatabase
} from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState({
    // User stats
    totalUsers: 0,
    totalPassengers: 0,
    totalDrivers: 0,
    
    // Driver stats (using different column names based on actual schema)
    verifiedDrivers: 0,
    pendingDrivers: 0,
    onlineDrivers: 0,
    
    // Ride stats
    totalRides: 0,
    activeRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    
    // Revenue stats
    totalRevenue: 0,
    platformCommission: 0,
    driverPayouts: 0,
    averageFare: 0,
    
    // Performance metrics
    completionRate: 0,
    cancellationRate: 0,
    averageDriverRating: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [recentRides, setRecentRides] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [schemaInfo, setSchemaInfo] = useState(null);
  
  const toast = useToast();

  // First, check the actual database schema
  const checkSchema = useCallback(async () => {
    try {
      // Check what columns exist in drivers table
      const { data: driversColumns, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .limit(1);
      
      if (driversError) {
        console.error('Error checking drivers table:', driversError);
        return null;
      }
      
      // Get the first driver to see available columns
      const firstDriver = driversColumns?.[0];
      const availableColumns = firstDriver ? Object.keys(firstDriver) : [];
      
      console.log('Available drivers columns:', availableColumns);
      
      // Check profiles table for driver approval status
      const { data: profilesColumns, error: profilesError } = await supabase
        .from('profiles')
        .select('is_driver_approved')
        .limit(1);
      
      if (profilesError) {
        console.error('Error checking profiles table:', profilesError);
      }
      
      return {
        drivers: availableColumns,
        hasApprovedColumn: availableColumns.includes('approved'),
        hasVerificationStatus: availableColumns.includes('verification_status'),
        hasIsOnline: availableColumns.includes('is_online'),
        hasProfilesApproval: !profilesError
      };
      
    } catch (error) {
      console.error('Error checking schema:', error);
      return null;
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // First check schema to know what columns we can use
      const schema = await checkSchema();
      setSchemaInfo(schema);
      
      console.log('Schema info:', schema);
      
      // Use today's date for filtering
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      // Fetch data in parallel - using safe queries that work with any schema
      const [
        usersResponse,
        ridesResponse,
        paymentsResponse,
        recentRidesResponse,
        recentUsersResponse,
        recentPaymentsResponse
      ] = await Promise.all([
        // Get all users with role breakdown - SIMPLE QUERY
        supabase
          .from('profiles')
          .select('id, role, created_at', { count: 'exact' }),
        
        // Get all rides - SIMPLE QUERY
        supabase
          .from('rides')
          .select('id, status, fare, actual_fare, created_at', { count: 'exact' }),
        
        // Get all successful payments - SIMPLE QUERY
        supabase
          .from('payments')
          .select('amount, commission, driver_earnings, status, created_at')
          .eq('status', 'success'),
        
        // Recent completed rides
        supabase
          .from('rides')
          .select(`
            id,
            fare,
            actual_fare,
            status,
            pickup_location,
            dropoff_location,
            created_at,
            passenger:passenger_id (
              id,
              full_name,
              phone
            ),
            driver:driver_id (
              id,
              full_name,
              phone
            )
          `)
          .in('status', ['completed', 'PAID'])
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent users
        supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            phone,
            role,
            created_at,
            rating
          `)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent payments
        supabase
          .from('payments')
          .select(`
            id,
            amount,
            commission,
            driver_earnings,
            status,
            created_at,
            passenger:passenger_id (
              full_name,
              phone
            ),
            driver:driver_id (
              full_name,
              phone
            )
          `)
          .eq('status', 'success')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Handle errors - be more lenient with drivers queries
      const criticalErrors = [
        usersResponse.error,
        ridesResponse.error,
        paymentsResponse.error
      ].filter(error => error && error.message !== 'No rows found');

      if (criticalErrors.length > 0) {
        throw new Error(`Failed to fetch critical data: ${criticalErrors[0]?.message}`);
      }

      // ===== CALCULATE BASIC STATS =====
      
      // User statistics
      const totalUsers = usersResponse.count || 0;
      const passengers = usersResponse.data?.filter(u => u.role === 'passenger').length || 0;
      const drivers = usersResponse.data?.filter(u => u.role === 'driver').length || 0;
      
      // Now fetch drivers data separately based on schema
      let verifiedDrivers = 0;
      let pendingDrivers = 0;
      let onlineDrivers = 0;
      let driverRatings = [];
      
      if (schema?.hasVerificationStatus) {
        // Use verification_status column
        const { data: driversData } = await supabase
          .from('drivers')
          .select('verification_status, rating, is_online')
          .eq('verification_status', 'verified');
        
        verifiedDrivers = driversData?.length || 0;
        pendingDrivers = drivers - verifiedDrivers;
        
        // Get online drivers if column exists
        if (schema.hasIsOnline) {
          const { data: onlineDriversData } = await supabase
            .from('drivers')
            .select('id')
            .eq('is_online', true);
          onlineDrivers = onlineDriversData?.length || 0;
        }
        
        // Get driver ratings
        const { data: allDriversData } = await supabase
          .from('drivers')
          .select('rating');
        
        driverRatings = allDriversData?.filter(d => d.rating > 0).map(d => d.rating) || [];
        
      } else if (schema?.hasProfilesApproval) {
        // Use profiles.is_driver_approved column
        const { data: approvedDriversData } = await supabase
          .from('profiles')
          .select('id, rating')
          .eq('role', 'driver')
          .eq('is_driver_approved', true);
        
        verifiedDrivers = approvedDriversData?.length || 0;
        pendingDrivers = drivers - verifiedDrivers;
        
        // Get driver ratings from profiles
        const { data: driverProfiles } = await supabase
          .from('profiles')
          .select('rating')
          .eq('role', 'driver');
        
        driverRatings = driverProfiles?.filter(p => p.rating > 0).map(p => p.rating) || [];
        
        // Try to get online status from drivers table if possible
        if (schema.hasIsOnline) {
          const { data: onlineDriversData } = await supabase
            .from('drivers')
            .select('id')
            .eq('is_online', true);
          onlineDrivers = onlineDriversData?.length || 0;
        }
      } else {
        // Fallback: assume all drivers are verified if we can't determine
        verifiedDrivers = drivers;
        pendingDrivers = 0;
      }
      
      // Calculate average driver rating
      const averageDriverRating = driverRatings.length > 0 
        ? driverRatings.reduce((a, b) => a + b, 0) / driverRatings.length 
        : 0;
      
      // Ride statistics
      const totalRides = ridesResponse.count || 0;
      const activeRides = ridesResponse.data?.filter(r => 
        ['requested', 'accepted', 'arrived', 'started', 'in_progress'].includes(r.status)
      ).length || 0;
      const completedRides = ridesResponse.data?.filter(r => 
        r.status === 'completed' || r.status === 'PAID'
      ).length || 0;
      const cancelledRides = ridesResponse.data?.filter(r => 
        r.status === 'cancelled'
      ).length || 0;
      
      // Calculate ride completion rate (excluding cancelled rides from total)
      const completionRate = calculatePercentage(completedRides, totalRides - cancelledRides);
      const cancellationRate = calculatePercentage(cancelledRides, totalRides);
      
      // Fare statistics
      const completedRidesData = ridesResponse.data?.filter(r => 
        r.status === 'completed' || r.status === 'PAID'
      ) || [];
      const totalFare = completedRidesData.reduce((sum, r) => 
        sum + (r.actual_fare || r.fare || 0), 0);
      const averageFare = completedRidesData.length > 0 ? totalFare / completedRidesData.length : 0;
      
      // Payment statistics
      const successfulPayments = paymentsResponse.data || [];
      const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const platformCommission = successfulPayments.reduce((sum, p) => sum + (p.commission || 0), 0);
      const driverPayouts = successfulPayments.reduce((sum, p) => 
        sum + (p.driver_earnings || 0), 0);
      
      // Today's stats
      const newUsersToday = usersResponse.data?.filter(u => {
        const userDate = new Date(u.created_at);
        return userDate >= new Date(todayStart) && userDate < new Date(todayEnd);
      }).length || 0;
      
      const ridesToday = ridesResponse.data?.filter(r => {
        const rideDate = new Date(r.created_at);
        return rideDate >= new Date(todayStart) && rideDate < new Date(todayEnd);
      }).length || 0;
      
      const revenueToday = successfulPayments.filter(p => {
        const paymentDate = new Date(p.created_at);
        return paymentDate >= new Date(todayStart) && paymentDate < new Date(todayEnd);
      }).reduce((sum, p) => sum + (p.amount || 0), 0);

      // Update stats
      setStats({
        totalUsers,
        totalPassengers: passengers,
        totalDrivers: drivers,
        verifiedDrivers,
        pendingDrivers,
        onlineDrivers,
        totalRides,
        activeRides,
        completedRides,
        cancelledRides,
        totalRevenue,
        platformCommission,
        driverPayouts,
        averageFare,
        completionRate,
        cancellationRate,
        averageDriverRating
      });

      // Set recent data
      setRecentRides(recentRidesResponse.data || []);
      setRecentUsers(recentUsersResponse.data || []);
      setRecentPayments(recentPaymentsResponse.data || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message);
      toast({
        title: 'Failed to load dashboard',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast, checkSchema]);

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions for core tables
    const ridesSubscription = supabase
      .channel('rides_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rides' 
        }, 
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();
      
    const profilesSubscription = supabase
      .channel('profiles_realtime')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();
      
    const paymentsSubscription = supabase
      .channel('payments_realtime')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'payments',
          filter: 'status=eq.success'
        }, 
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ridesSubscription);
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(paymentsSubscription);
    };
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const getStatusColor = (status) => {
    if (!status) return { bg: 'gray.100', color: 'gray.800' };
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'success':
        return { bg: 'green.100', color: 'green.800' };
      case 'accepted':
      case 'arrived':
      case 'started':
      case 'in_progress':
        return { bg: 'blue.100', color: 'blue.800' };
      case 'requested':
      case 'pending':
        return { bg: 'orange.100', color: 'orange.800' };
      case 'completed_pending_payment':
        return { bg: 'yellow.100', color: 'yellow.800' };
      case 'cancelled':
      case 'failed':
        return { bg: 'red.100', color: 'red.800' };
      default:
        return { bg: 'gray.100', color: 'gray.800' };
    }
  };

  if (error) {
    return (
      <PageContainer
        title="Dashboard Overview"
        subtitle="Real-time insights and analytics"
      >
        <Alert status="error" borderRadius="lg" mb={6}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Failed to Load Dashboard</AlertTitle>
            <AlertDescription fontSize="sm">
              {error}
            </AlertDescription>
          </Box>
          <Button
            leftIcon={<FaRedo />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            Retry
          </Button>
        </Alert>
        
        {/* Schema Debug Info */}
        {schemaInfo && (
          <Card mt={6} borderColor="gray.200">
            <CardHeader bg="gray.50" py={3}>
              <HStack>
                <Icon as={FaDatabase} color="gray.500" />
                <Text fontWeight="medium">Schema Information</Text>
              </HStack>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600">Drivers Table Columns:</Text>
                  <Text fontSize="xs" color="gray.500" fontFamily="mono">
                    {schemaInfo.drivers?.join(', ') || 'Unknown'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Available Status Fields:</Text>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Box w="2" h="2" borderRadius="full" bg={schemaInfo.hasApprovedColumn ? 'green.500' : 'red.500'} />
                      <Text fontSize="xs">approved column: {schemaInfo.hasApprovedColumn ? 'Yes' : 'No'}</Text>
                    </HStack>
                    <HStack>
                      <Box w="2" h="2" borderRadius="full" bg={schemaInfo.hasVerificationStatus ? 'green.500' : 'red.500'} />
                      <Text fontSize="xs">verification_status: {schemaInfo.hasVerificationStatus ? 'Yes' : 'No'}</Text>
                    </HStack>
                    <HStack>
                      <Box w="2" h="2" borderRadius="full" bg={schemaInfo.hasProfilesApproval ? 'green.500' : 'red.500'} />
                      <Text fontSize="xs">profiles.is_driver_approved: {schemaInfo.hasProfilesApproval ? 'Yes' : 'No'}</Text>
                    </HStack>
                  </VStack>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>
        )}
      </PageContainer>
    );
  }

  if (loading && !refreshing) {
    return (
      <PageContainer
        title="Dashboard Overview"
        subtitle="Real-time insights and analytics"
      >
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height="120px" borderRadius="xl" />
          ))}
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Skeleton height="400px" borderRadius="xl" />
          <Skeleton height="400px" borderRadius="xl" />
        </SimpleGrid>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Dashboard Overview"
      subtitle="Real-time insights and analytics for your tricycle ride platform"
      action={
        <Button
          leftIcon={<FaRedo />}
          size="sm"
          onClick={handleRefresh}
          isLoading={refreshing}
          variant="outline"
        >
          Refresh
        </Button>
      }
    >
      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard
          title="Total Users"
          value={formatNumber(stats.totalUsers)}
          icon={FaUsers}
          color="blue"
          change={`${stats.totalPassengers} passengers • ${stats.totalDrivers} drivers`}
          isLoading={refreshing}
        />
        
        <StatCard
          title="Verified Drivers"
          value={formatNumber(stats.verifiedDrivers)}
          icon={FaUserFriends}
          color="green"
          change={`${stats.pendingDrivers} pending verification`}
          isLoading={refreshing}
        />
        
        <StatCard
          title="Total Rides"
          value={formatNumber(stats.totalRides)}
          icon={FaMotorcycle}
          color="purple"
          change={`${stats.activeRides} active • ${stats.completedRides} completed`}
          isLoading={refreshing}
        />
        
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={FaDollarSign}
          color="brand"
          change={`${formatCurrency(stats.platformCommission)} commission earned`}
          subtitle="All time"
          isLoading={refreshing}
        />
      </SimpleGrid>

      {/* Performance Metrics */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={8}>
        <Card borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
          <CardHeader pb={3}>
            <Heading size="md" color="gray.800">
              Platform Performance
            </Heading>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Key metrics and analytics
            </Text>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={6}>
              <Box>
                <HStack mb={2}>
                  <Icon as={FaCheckCircle} color="green.500" />
                  <Text fontWeight="medium" color="gray.700">Completion Rate</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                  {stats.completionRate.toFixed(1)}%
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {stats.completedRides} completed rides
                </Text>
              </Box>
              
              <Box>
                <HStack mb={2}>
                  <Icon as={FaExclamationTriangle} color="orange.500" />
                  <Text fontWeight="medium" color="gray.700">Cancellation Rate</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                  {stats.cancellationRate.toFixed(1)}%
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {stats.cancelledRides} cancelled rides
                </Text>
              </Box>
              
              <Box>
                <HStack mb={2}>
                  <Icon as={FaStar} color="yellow.500" />
                  <Text fontWeight="medium" color="gray.700">Avg Driver Rating</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                  {stats.averageDriverRating.toFixed(1)}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Based on driver ratings
                </Text>
              </Box>
              
              <Box>
                <HStack mb={2}>
                  <Icon as={FaDollarSign} color="teal.500" />
                  <Text fontWeight="medium" color="gray.700">Avg Fare</Text>
                </HStack>
                <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                  {formatCurrency(stats.averageFare)}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Per completed ride
                </Text>
              </Box>
            </SimpleGrid>
            
            {/* Progress bars */}
            <Box mt={6}>
              <Flex justify="space-between" mb={2}>
                <Text fontSize="sm" color="gray.600">Driver Verification</Text>
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  {calculatePercentage(stats.verifiedDrivers, stats.totalDrivers).toFixed(1)}%
                </Text>
              </Flex>
              <Progress 
                value={calculatePercentage(stats.verifiedDrivers, stats.totalDrivers)} 
                colorScheme="green" 
                size="sm" 
                borderRadius="full"
                bg="green.50"
              />
              
              <Flex justify="space-between" mt={4} mb={2}>
                <Text fontSize="sm" color="gray.600">Ride Completion</Text>
                <Text fontSize="sm" fontWeight="medium" color="gray.800">
                  {stats.completionRate.toFixed(1)}%
                </Text>
              </Flex>
              <Progress 
                value={stats.completionRate} 
                colorScheme="blue" 
                size="sm" 
                borderRadius="full"
                bg="blue.50"
              />
            </Box>
          </CardBody>
        </Card>

        {/* Analytics Chart */}
        <Card borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
          <CardHeader pb={3}>
            <HStack justify="space-between" align="center">
              <Heading size="md" color="gray.800">
                Revenue Analytics
              </Heading>
              <Badge colorScheme="brand" variant="subtle" borderRadius="full" px={3} py={1}>
                Last 7 Days
              </Badge>
            </HStack>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Daily revenue trends
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <AnalyticsChart 
              timeRange="7d"
              metric="revenue"
              chartType="line"
            />
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Recent Activity */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        {/* Recent Rides */}
        <Card borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
          <CardHeader pb={3}>
            <HStack justify="space-between" align="center">
              <Heading size="md" color="gray.800">
                Recent Rides
              </Heading>
              <Badge colorScheme="blue" variant="subtle" borderRadius="full" px={3} py={1}>
                {recentRides.length} rides
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack divider={<Divider borderColor="gray.200" />} spacing={0} align="stretch" maxH="400px" overflowY="auto">
              {recentRides.length > 0 ? recentRides.map((ride) => {
                const statusColor = getStatusColor(ride.status);
                return (
                  <Box 
                    key={ride.id} 
                    p={4} 
                    _hover={{ bg: 'gray.50' }}
                    transition="all 0.2s"
                    borderRadius="md"
                  >
                    <Flex justify="space-between" align="start">
                      <Box flex={1}>
                        <Text fontWeight="medium" color="gray.800" fontSize="sm" mb={1}>
                          {ride.passenger?.full_name || 'Passenger'} → {ride.driver?.full_name || 'Driver'}
                        </Text>
                        <Text fontSize="xs" color="gray.600" mb={2}>
                          {ride.pickup_location?.substring(0, 40)}...
                        </Text>
                        <Flex justify="space-between" align="center">
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(ride.created_at)}
                          </Text>
                          <Text fontSize="sm" fontWeight="bold" color="gray.800">
                            {formatCurrency(ride.actual_fare || ride.fare || 0)}
                          </Text>
                        </Flex>
                      </Box>
                      <Badge
                        bg={statusColor.bg}
                        color={statusColor.color}
                        fontSize="xs"
                        fontWeight="semibold"
                        px={3}
                        py={1}
                        borderRadius="full"
                        ml={4}
                        textTransform="capitalize"
                      >
                        {ride.status?.toLowerCase()}
                      </Badge>
                    </Flex>
                  </Box>
                );
              }) : (
                <Box p={6} textAlign="center">
                  <Icon as={FaRoute} color="gray.400" boxSize={8} mb={3} />
                  <Text color="gray.500" fontSize="sm">
                    No recent rides available
                  </Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Recent Users */}
        <Card borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200">
          <CardHeader pb={3}>
            <HStack justify="space-between" align="center">
              <Heading size="md" color="gray.800">
                Recent Users
              </Heading>
              <Badge colorScheme="green" variant="subtle" borderRadius="full" px={3} py={1}>
                {recentUsers.length} users
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack divider={<Divider borderColor="gray.200" />} spacing={0} align="stretch" maxH="400px" overflowY="auto">
              {recentUsers.length > 0 ? recentUsers.map((user) => (
                <Box 
                  key={user.id} 
                  p={4} 
                  _hover={{ bg: 'gray.50' }}
                  transition="all 0.2s"
                  borderRadius="md"
                >
                  <Flex justify="space-between" align="center">
                    <Box flex={1}>
                      <Flex align="center" mb={2}>
                        <Icon as={user.role === 'driver' ? FaUserFriends : FaUser} 
                          color={user.role === 'driver' ? 'green.500' : 'blue.500'} 
                          mr={3} 
                          boxSize={5} 
                        />
                        <Box>
                          <Text fontWeight="medium" color="gray.800" fontSize="sm">
                            {user.full_name || 'New User'}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {user.email}
                          </Text>
                        </Box>
                      </Flex>
                      <Text fontSize="xs" color="gray.500">
                        Joined {formatDate(user.created_at)} • {user.role}
                      </Text>
                    </Box>
                    {user.role === 'driver' && user.rating && (
                      <HStack spacing={1}>
                        <Icon as={FaStar} color="yellow.500" size="xs" />
                        <Text fontSize="xs" color="gray.600">
                          {user.rating.toFixed(1)}
                        </Text>
                      </HStack>
                    )}
                  </Flex>
                </Box>
              )) : (
                <Box p={6} textAlign="center">
                  <Icon as={FaUserPlus} color="gray.400" boxSize={8} mb={3} />
                  <Text color="gray.500" fontSize="sm">
                    No recent users
                  </Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card borderRadius="xl" boxShadow="sm" borderWidth="1px" borderColor="gray.200" mt={6}>
          <CardHeader pb={3}>
            <HStack justify="space-between" align="center">
              <Heading size="md" color="gray.800">
                Recent Payments
              </Heading>
              <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={3} py={1}>
                {recentPayments.length} payments
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Amount</Th>
                    <Th>Commission</Th>
                    <Th>Driver Earnings</Th>
                    <Th>Passenger</Th>
                    <Th>Driver</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {recentPayments.map((payment) => (
                    <Tr key={payment.id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="bold">{formatCurrency(payment.amount)}</Td>
                      <Td color="red.600">{formatCurrency(payment.commission)}</Td>
                      <Td color="green.600">{formatCurrency(payment.driver_earnings)}</Td>
                      <Td fontSize="sm">{payment.passenger?.full_name || 'N/A'}</Td>
                      <Td fontSize="sm">{payment.driver?.full_name || 'N/A'}</Td>
                      <Td fontSize="xs">{formatDate(payment.created_at)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      )}
    </PageContainer>
  );
};

export default Dashboard;