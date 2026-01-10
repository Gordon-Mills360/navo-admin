import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import UserCard from '../components/UserCard';
import PageContainer from '../components/PageContainer';
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  Badge,
  Button,
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
  FaSearch, 
  FaFilter, 
  FaUsers, 
  FaUser, 
  FaUserFriends, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSyncAlt,
  FaExclamationTriangle
} from 'react-icons/fa';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      
      // Try the join query first
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          role,
          is_driver_approved,
          rating,
          is_online,
          vehicle_number,
          created_at,
          updated_at,
          driver:drivers (
            id,
            user_id,
            approved,
            suspended,
            verification_status,
            is_online,
            rating,
            total_rides,
            completed_rides,
            total_earnings
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Join query failed:', fetchError);
        
        // Fallback: fetch profiles only
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            full_name,
            phone,
            role,
            is_driver_approved,
            rating,
            is_online,
            vehicle_number,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });
          
        if (profilesError) throw profilesError;
        
        // Fetch drivers separately if needed
        const { data: driversData } = await supabase
          .from('drivers')
          .select('*');
          
        // Combine data
        const usersWithDriverInfo = (profilesData || []).map(profile => {
          const driverInfo = driversData?.find(d => d.user_id === profile.id);
          return {
            ...profile,
            driver: driverInfo ? [driverInfo] : []
          };
        });
        
        setUsers(usersWithDriverInfo);
        return;
      }

      setUsers(data || []);
      
    } catch (error) {
      console.error('Error fetching users:', error);
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
    fetchUsers();
    
    // Real-time subscription for user changes
    const usersSubscription = supabase
      .channel('users_updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles' 
        }, 
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersSubscription);
    };
  }, [fetchUsers]);

  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.full_name || '').toLowerCase().includes(term) ||
        (user.email || '').toLowerCase().includes(term) ||
        (user.phone || '').toLowerCase().includes(term)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.is_online || true; // Default to true if is_online doesn't exist
        if (statusFilter === 'inactive') return !(user.is_online || true);
        if (statusFilter === 'driver_pending') {
          return user.role === 'driver' && 
                 (!user.driver?.[0]?.approved && 
                  !user.driver?.[0]?.suspended && 
                  user.driver?.[0]?.verification_status === 'pending');
        }
        if (statusFilter === 'driver_approved') {
          return user.role === 'driver' && 
                 (user.driver?.[0]?.approved || 
                  user.driver?.[0]?.verification_status === 'verified');
        }
        return true;
      });
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleUserStatusToggle = async (userId, currentIsActive) => {
    try {
      const newStatus = !currentIsActive;
      
      const { error } = await supabase
        .from('profiles')
        .update({ is_online: newStatus })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_online: newStatus } : user
        )
      );

      // Also update driver status if they are a driver
      const user = users.find(u => u.id === userId);
      if (user?.role === 'driver' && user.driver?.[0]) {
        await supabase
          .from('drivers')
          .update({ 
            is_online: newStatus,
            suspended: !newStatus 
          })
          .eq('user_id', userId);
      }

      toast({
        title: newStatus ? 'User Activated' : 'User Deactivated',
        description: `User account has been ${newStatus ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStats = () => {
    const total = users.length;
    const passengers = users.filter(u => u.role === 'passenger').length;
    const drivers = users.filter(u => u.role === 'driver').length;
    const activeDrivers = users.filter(u => 
      u.role === 'driver' && 
      (u.driver?.[0]?.approved || u.driver?.[0]?.verification_status === 'verified')
    ).length;
    const pendingDrivers = users.filter(u => 
      u.role === 'driver' && 
      !u.driver?.[0]?.approved && 
      u.driver?.[0]?.verification_status === 'pending'
    ).length;
    
    // For online status, use is_online or default to true
    const online = users.filter(u => u.is_online || true).length;

    return { 
      total, 
      passengers, 
      drivers, 
      activeDrivers, 
      pendingDrivers, 
      online 
    };
  };

  const stats = getStats();

  if (error) {
    return (
      <PageContainer
        title="Users Management"
        subtitle="Manage all passengers and drivers"
      >
        <Alert status="error" borderRadius="lg" mb={6}>
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Failed to Load Users</AlertTitle>
            <AlertDescription fontSize="sm">
              {error}
            </AlertDescription>
          </Box>
          <Button
            leftIcon={<FaSyncAlt />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={fetchUsers}
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
      title="Users Management"
      subtitle="Manage all passengers and drivers"
      action={
        <Button
          leftIcon={<FaSyncAlt />}
          size="sm"
          onClick={fetchUsers}
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
              <StatLabel fontSize="xs" color="gray.600">Total Users</StatLabel>
              <StatNumber fontSize="xl">{stats.total}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                15.2%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Passengers</StatLabel>
              <StatNumber fontSize="xl" color="blue.500">{stats.passengers}</StatNumber>
              <Progress 
                value={stats.total > 0 ? (stats.passengers / stats.total) * 100 : 0} 
                colorScheme="blue" 
                size="sm" 
                mt={2}
              />
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Drivers</StatLabel>
              <StatNumber fontSize="xl" color="green.500">{stats.drivers}</StatNumber>
              <StatHelpText fontSize="xs">
                {stats.activeDrivers} active
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Active Drivers</StatLabel>
              <StatNumber fontSize="xl" color="green.500">{stats.activeDrivers}</StatNumber>
              <StatHelpText fontSize="xs">
                {stats.pendingDrivers} pending
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Pending Drivers</StatLabel>
              <StatNumber fontSize="xl" color="yellow.500">{stats.pendingDrivers}</StatNumber>
              <Progress 
                value={stats.drivers > 0 ? (stats.pendingDrivers / stats.drivers) * 100 : 0} 
                colorScheme="yellow" 
                size="sm" 
                mt={2}
              />
            </Stat>
          </CardBody>
        </Card>
        
        <Card borderRadius="lg">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.600">Online</StatLabel>
              <StatNumber fontSize="xl">{stats.online}</StatNumber>
              <StatHelpText fontSize="xs">
                {stats.total - stats.online} offline
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <Grid templateColumns={{ base: '1fr', md: '2fr 1fr 1fr auto' }} gap={4} alignItems="center">
            <GridItem>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search users by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="white"
                />
              </InputGroup>
            </GridItem>
            
            <GridItem>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                bg="white"
                leftIcon={<FaUser />}
              >
                <option value="all">All Roles</option>
                <option value="passenger">Passengers</option>
                <option value="driver">Drivers</option>
                <option value="admin">Admins</option>
              </Select>
            </GridItem>
            
            <GridItem>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                bg="white"
                leftIcon={<FaFilter />}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="driver_pending">Driver Pending</option>
                <option value="driver_approved">Driver Approved</option>
              </Select>
            </GridItem>
            
            <GridItem>
              <Button
                leftIcon={<FaSyncAlt />}
                onClick={fetchUsers}
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
              Total: {filteredUsers.length} users
            </Badge>
            <Badge colorScheme="blue" px={3} py={1}>
              Passengers: {filteredUsers.filter(u => u.role === 'passenger').length}
            </Badge>
            <Badge colorScheme="green" px={3} py={1}>
              Drivers: {filteredUsers.filter(u => u.role === 'driver').length}
            </Badge>
            <Badge colorScheme="yellow" px={3} py={1}>
              Pending: {filteredUsers.filter(u => 
                u.role === 'driver' && 
                !u.driver?.[0]?.approved && 
                u.driver?.[0]?.verification_status === 'pending'
              ).length}
            </Badge>
          </HStack>
        </CardBody>
      </Card>

      {/* Users List */}
      {loading ? (
        <Card>
          <CardBody textAlign="center" py={20}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
            <Text mt={4} color="gray.600">
              Loading users...
            </Text>
          </CardBody>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardBody textAlign="center" py={20}>
            <FaUsers size={64} color="#CBD5E0" />
            <Text mt={4} fontSize="lg" color="gray.600">
              {users.length === 0 ? 'No users found in the system' : 'No users match your search criteria'}
            </Text>
            {users.length === 0 && (
              <Text fontSize="sm" color="gray.500" mt={2}>
                Users will appear here when they register
              </Text>
            )}
          </CardBody>
        </Card>
      ) : (
        <VStack spacing={4} align="stretch">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onStatusToggle={handleUserStatusToggle}
            />
          ))}
        </VStack>
      )}

      {/* Summary Footer */}
      {!loading && filteredUsers.length > 0 && (
        <Card mt={4}>
          <CardBody>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.500">
                  Showing {filteredUsers.length} of {users.length} users
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Real-time updates active
                </Text>
              </VStack>
              <Badge colorScheme="green" px={3} py={1}>
                Last updated: {new Date().toLocaleTimeString()}
              </Badge>
            </Flex>
          </CardBody>
        </Card>
      )}
    </PageContainer>
  );
};

export default Users;