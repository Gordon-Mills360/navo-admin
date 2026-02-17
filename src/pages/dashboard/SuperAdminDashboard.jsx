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
  Progress,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FaUsers,
  FaUserFriends,
  FaMotorcycle,
  FaDollarSign,
  FaChartLine,
  FaShieldAlt,
  FaCog,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaEllipsisV,
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useRealTime } from '../../contexts/RealTimeContext';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { supabase } from '../../services/supabase';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/shared/StatCard';
import DataTable from '../../components/shared/DataTable';

const SuperAdminDashboard = () => {
  const { admin } = useAuth();
  const { realTimeData, refreshData } = useRealTime();
  const { logAdminAction } = useAdminAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalPassengers: 0,
    totalTrips: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    activeAdmins: 0,
    systemHealth: 100,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentAdmins, setRecentAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all stats in parallel
      const [
        usersRes,
        driversRes,
        passengersRes,
        tripsRes,
        paymentsRes,
        verificationsRes,
        adminsRes,
        activitiesRes,
        recentAdminsRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('drivers').select('id', { count: 'exact', head: true }),
        supabase.from('passengers').select('id', { count: 'exact', head: true }),
        supabase.from('trips').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('driver_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('admins').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('admin_actions_log').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('admins').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      // Calculate total revenue
      const totalRevenue = paymentsRes.data?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalDrivers: driversRes.count || 0,
        totalPassengers: passengersRes.count || 0,
        totalTrips: tripsRes.count || 0,
        totalRevenue,
        pendingApprovals: verificationsRes.count || 0,
        activeAdmins: adminsRes.count || 0,
        systemHealth: 100, // In production, calculate based on services
      });

      setRecentActivities(activitiesRes.data || []);
      setRecentAdmins(recentAdminsRes.data || []);
      
      // Refresh real-time data
      await refreshData();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscriptions
    const subscriptions = [
      supabase
        .channel('dashboard_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, fetchDashboardData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchDashboardData)
        .subscribe(),
    ];

    return () => {
      subscriptions.forEach(sub => supabase.removeChannel(sub));
    };
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const getActionColor = (action) => {
    if (action.includes('APPROVE') || action.includes('CREATE')) return 'green';
    if (action.includes('SUSPEND') || action.includes('REJECT') || action.includes('DELETE')) return 'red';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'blue';
    return 'gray';
  };

  if (loading) {
    return (
      <Layout>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          {[...Array(8)].map((_, i) => (
            <Box key={i} height="120px" bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} />
          ))}
        </SimpleGrid>
      </Layout>
    );
  }

  return (
    <Layout>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" color="gray.800">
              Super Admin Dashboard
            </Heading>
            <Text color="gray.600" mt={1}>
              Complete system overview and control
            </Text>
          </Box>
          <Button
            leftIcon={<FaChartLine />}
            colorScheme="brand"
            onClick={fetchDashboardData}
            size="sm"
          >
            Refresh Data
          </Button>
        </Flex>

        {/* Alert Banner */}
        {realTimeData.emergencies?.length > 0 && (
          <Alert status="error" borderRadius="lg" variant="left-accent">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Active Emergencies</AlertTitle>
              <AlertDescription>
                {realTimeData.emergencies.length} emergency situation(s) require attention
              </AlertDescription>
            </Box>
            <Button colorScheme="red" size="sm" variant="solid">
              View Emergencies
            </Button>
          </Alert>
        )}

        {/* Main Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={FaUsers}
            color="blue"
            change={`${stats.totalDrivers} drivers • ${stats.totalPassengers} passengers`}
            trend="up"
          />
          
          <StatCard
            title="Active Trips"
            value={realTimeData.activeTrips?.toString() || '0'}
            icon={FaMotorcycle}
            color="green"
            change={`${stats.totalTrips.toLocaleString()} total trips`}
            trend="up"
          />
          
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={FaDollarSign}
            color="brand"
            change="All time earnings"
            trend="up"
          />
          
          <StatCard
            title="System Health"
            value={`${stats.systemHealth}%`}
            icon={FaShieldAlt}
            color={stats.systemHealth > 90 ? 'green' : stats.systemHealth > 70 ? 'yellow' : 'red'}
            change="All services operational"
            trend="stable"
          />
        </SimpleGrid>

        {/* Second Row Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            title="Pending Approvals"
            value={stats.pendingApprovals.toString()}
            icon={FaUserFriends}
            color="orange"
            change="Driver verifications pending"
            trend="up"
          />
          
          <StatCard
            title="Online Drivers"
            value={realTimeData.onlineDrivers?.toString() || '0'}
            icon={FaUserFriends}
            color="teal"
            change="Currently available"
            trend="up"
          />
          
          <StatCard
            title="Active Admins"
            value={stats.activeAdmins.toString()}
            icon={FaShieldAlt}
            color="purple"
            change="Currently logged in"
            trend="stable"
          />
          
          <StatCard
            title="Success Rate"
            value="98.5%"
            icon={FaCheckCircle}
            color="green"
            change="Trip completion rate"
            trend="up"
          />
        </SimpleGrid>

        {/* Charts and Tables Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Recent Activities */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Recent Admin Activities</Heading>
                <Badge colorScheme="brand" variant="subtle">
                  Live
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <Box maxH="400px" overflowY="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Admin</Th>
                      <Th>Action</Th>
                      <Th>Target</Th>
                      <Th>Time</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {recentActivities.map((activity) => (
                      <Tr key={activity.id} _hover={{ bg: 'gray.50' }}>
                        <Td>
                          <Text fontSize="sm" fontWeight="medium">
                            {activity.admin_email?.split('@')[0]}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {activity.admin_role}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getActionColor(activity.action)}
                            variant="subtle"
                            fontSize="xs"
                          >
                            {activity.action.replace('_', ' ')}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm" noOfLines={1}>
                            {activity.resource_type}: {activity.resource_id?.slice(0, 8)}...
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(activity.created_at)}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
            <CardFooter pt={0}>
              <Button
                leftIcon={<FaEye />}
                variant="ghost"
                size="sm"
                w="100%"
                as={Link}
                href="/admin-management/audit-logs"
              >
                View All Activities
              </Button>
            </CardFooter>
          </Card>

          {/* Admin Management */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Flex justify="space-between" align="center">
                <Heading size="md">Admin Management</Heading>
                <Button
                  leftIcon={<FaUsers />}
                  colorScheme="brand"
                  size="sm"
                  as={Link}
                  href="/admin-management/admins"
                >
                  Manage
                </Button>
              </Flex>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="stretch">
                {recentAdmins.map((adminUser) => (
                  <Flex
                    key={adminUser.id}
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
                        bg="brand.500"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        fontWeight="bold"
                      >
                        {adminUser.name?.charAt(0) || 'A'}
                      </Box>
                      <Box>
                        <Text fontWeight="medium" fontSize="sm">
                          {adminUser.name || adminUser.email}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {adminUser.role?.replace('_', ' ')}
                        </Text>
                      </Box>
                    </HStack>
                    <Menu>
                      <MenuButton
                        as={Button}
                        variant="ghost"
                        size="sm"
                        px={2}
                        minW="auto"
                      >
                        <FaEllipsisV />
                      </MenuButton>
                      <MenuList minW="150px">
                        <MenuItem icon={<FaEye />} fontSize="sm">
                          View
                        </MenuItem>
                        <MenuItem icon={<FaEdit />} fontSize="sm">
                          Edit
                        </MenuItem>
                        <MenuItem icon={<FaTrash />} fontSize="sm" color="red.500">
                          Suspend
                        </MenuItem>
                      </MenuList>
                    </Menu>
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
                as={Link}
                href="/admin-management/admins/create"
              >
                Create New Admin
              </Button>
            </CardFooter>
          </Card>
        </SimpleGrid>

        {/* System Health & Quick Actions */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* System Health */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Heading size="md">System Health</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {[
                  { service: 'Database', status: 'healthy', value: 100 },
                  { service: 'API Gateway', status: 'healthy', value: 100 },
                  { service: 'Payment Service', status: 'healthy', value: 98 },
                  { service: 'Notification Service', status: 'healthy', value: 95 },
                  { service: 'Geolocation Service', status: 'healthy', value: 99 },
                ].map((service) => (
                  <Box key={service.service}>
                    <Flex justify="space-between" mb={2}>
                      <Text fontSize="sm" fontWeight="medium">
                        {service.service}
                      </Text>
                      <Badge
                        colorScheme={service.value > 90 ? 'green' : service.value > 70 ? 'yellow' : 'red'}
                        variant="subtle"
                        fontSize="xs"
                      >
                        {service.status}
                      </Badge>
                    </Flex>
                    <Progress
                      value={service.value}
                      colorScheme={service.value > 90 ? 'green' : service.value > 70 ? 'yellow' : 'red'}
                      size="sm"
                      borderRadius="full"
                      bg="gray.100"
                    />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <CardHeader pb={3}>
              <Heading size="md">Quick Actions</Heading>
            </CardHeader>
            <CardBody>
              <SimpleGrid columns={2} spacing={4}>
                <Button
                  leftIcon={<FaCog />}
                  colorScheme="blue"
                  variant="outline"
                  h="auto"
                  py={4}
                  onClick={() => window.location.href = '/system/settings'}
                >
                  <Box textAlign="left">
                    <Text fontWeight="semibold">System Settings</Text>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      Configure platform
                    </Text>
                  </Box>
                </Button>
                
                <Button
                  leftIcon={<FaUserFriends />}
                  colorScheme="green"
                  variant="outline"
                  h="auto"
                  py={4}
                  onClick={() => window.location.href = '/accounts/drivers'}
                >
                  <Box textAlign="left">
                    <Text fontWeight="semibold">Approve Drivers</Text>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      {stats.pendingApprovals} pending
                    </Text>
                  </Box>
                </Button>
                
                <Button
                  leftIcon={<FaDollarSign />}
                  colorScheme="purple"
                  variant="outline"
                  h="auto"
                  py={4}
                  onClick={() => window.location.href = '/finance/payouts'}
                >
                  <Box textAlign="left">
                    <Text fontWeight="semibold">Process Payouts</Text>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      Driver payments
                    </Text>
                  </Box>
                </Button>
                
                <Button
                  leftIcon={<FaShieldAlt />}
                  colorScheme="red"
                  variant="outline"
                  h="auto"
                  py={4}
                  onClick={() => window.location.href = '/admin-management/audit-logs'}
                >
                  <Box textAlign="left">
                    <Text fontWeight="semibold">Audit Logs</Text>
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      View all activities
                    </Text>
                  </Box>
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Layout>
  );
};

export default SuperAdminDashboard;