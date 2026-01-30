import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Flex,
  Input,
  Button,
  SimpleGrid,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
  useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
import { supabase } from '../services/supabase';
import { supabaseAdmin } from '../services/supabase'; // Added admin client import
import DriverCard from '../components/DriverCard';
import DriverApprovalCard from '../components/DriverApprovalCard';
import { FaSearch, FaSyncAlt, FaFilter } from 'react-icons/fa';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'suspended', 'online', 'offline'
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    suspended: 0,
    online: 0,
    offline: 0
  });
  
  // For rejection modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // For suspension modal
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch drivers data with all details
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      
      // Query to get all driver information in one go
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select(`
          *,
          profile:user_id (
            id,
            full_name,
            email,
            phone,
            created_at,
            is_active,
            account_status,
            approved_at,
            rejected_at,
            rejection_reason,
            email_verified
          ),
          vehicle:driver_vehicles (*)
        `)
        .order('created_at', { ascending: false });
      
      if (driversError) {
        console.error('Error fetching drivers:', driversError);
        // Fallback to old method if drivers table doesn't exist
        await fetchDriversLegacy();
        return;
      }
      
      if (driversData) {
        // Transform the data to match our expected structure
        const formattedDrivers = driversData.map(driver => ({
          id: driver.id,
          user_id: driver.user_id,
          full_name: driver.profile?.full_name || 'Unknown',
          email: driver.profile?.email || '',
          phone: driver.profile?.phone || '',
          created_at: driver.created_at,
          is_active: driver.profile?.is_active || false,
          account_status: driver.profile?.account_status || 'pending',
          approved_at: driver.profile?.approved_at || driver.approved_at,
          rejected: driver.rejected || false,
          rejected_at: driver.profile?.rejected_at,
          rejection_reason: driver.profile?.rejection_reason || driver.rejection_reason,
          suspended: driver.suspended || false,
          suspension_reason: driver.suspension_reason,
          suspended_at: driver.suspended_at,
          online: driver.online || false,
          last_active: driver.last_active,
          total_rides: driver.total_rides_completed || 0,
          total_earnings: driver.total_earnings || 0,
          rating: driver.rating || 0,
          vehicle: driver.vehicle || null,
          documents: {
            id_document: driver.id_document_url,
            license: driver.license_url,
            vehicle_registration: driver.vehicle_registration_url,
            insurance: driver.insurance_url
          },
          reviewed_at: driver.reviewed_at,
          reviewed_by: driver.reviewed_by,
          email_verified: driver.profile?.email_verified || false
        }));
        
        setDrivers(formattedDrivers);
        calculateStats(formattedDrivers);
      }
      
    } catch (error) {
      console.error('Error in fetchDrivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drivers. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Legacy method for backward compatibility
  const fetchDriversLegacy = async () => {
    try {
      // First, get profiles with driver role
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'driver')
        .order('created_at', { ascending: false });
      
      if (profilesError) throw profilesError;
      
      // For each driver, get their vehicle info
      const driversWithDetails = await Promise.all(
        profiles.map(async (driver) => {
          const { data: vehicle, error: vehicleError } = await supabase
            .from('driver_vehicles')
            .select('*')
            .eq('driver_id', driver.id)
            .single();
          
          // Get driver-specific data
          const { data: driverData, error: driverDataError } = await supabase
            .from('drivers')
            .select('*')
            .eq('user_id', driver.id)
            .single();
          
          return {
            ...driver,
            user_id: driver.id,
            full_name: driver.full_name || 'Unknown',
            account_status: driver.account_status || 'pending',
            suspended: driverData?.suspended || false,
            suspension_reason: driverData?.suspension_reason,
            online: driverData?.online || false,
            total_rides: driverData?.total_rides || 0,
            total_earnings: driverData?.total_earnings || 0,
            rating: driverData?.rating || 0,
            vehicle: vehicle || null,
            documents: driverData ? {
              id_document: driverData.id_document_url,
              license: driverData.license_url,
              vehicle_registration: driverData.vehicle_registration_url,
              insurance: driverData.insurance_url
            } : null,
            reviewed_at: driverData?.reviewed_at,
            reviewed_by: driverData?.reviewed_by,
            email_verified: driver.email_verified || false
          };
        })
      );
      
      setDrivers(driversWithDetails);
      calculateStats(driversWithDetails);
      
    } catch (error) {
      console.error('Error in fetchDriversLegacy:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drivers. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Calculate statistics
  const calculateStats = (driversList) => {
    const stats = {
      total: driversList.length,
      pending: driversList.filter(d => d.account_status === 'pending' && !d.rejected && !d.suspended).length,
      approved: driversList.filter(d => d.account_status === 'approved' && !d.suspended).length,
      suspended: driversList.filter(d => d.suspended).length,
      online: driversList.filter(d => d.online && !d.suspended).length,
      offline: driversList.filter(d => !d.online && !d.suspended && d.account_status === 'approved').length
    };
    setStats(stats);
  };

  useEffect(() => {
    fetchDrivers();
    
    // Set up real-time subscription for driver changes
    const driversChannel = supabase
      .channel('drivers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        () => {
          fetchDrivers();
        }
      )
      .subscribe();

    // Subscribe to profile changes for driver status - ADDED REAL-TIME PROFILE UPDATES
    const profileChannel = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: 'role=eq.driver'
        },
        (payload) => {
          console.log('Profile updated:', payload.new);
          // Update specific driver in state
          setDrivers(prevDrivers =>
            prevDrivers.map(driver =>
              driver.id === payload.new.id || driver.user_id === payload.new.id
                ? { 
                    ...driver, 
                    account_status: payload.new.account_status,
                    is_active: payload.new.is_active,
                    email_verified: payload.new.email_verified,
                    approved_at: payload.new.approved_at,
                    rejected_at: payload.new.rejected_at,
                    rejection_reason: payload.new.rejection_reason,
                    full_name: payload.new.full_name || driver.full_name,
                    email: payload.new.email || driver.email,
                    phone: payload.new.phone || driver.phone
                  }
                : driver
            )
          );
          
          // Recalculate stats after profile update
          setDrivers(prev => {
            const updatedList = prev.map(driver =>
              driver.id === payload.new.id || driver.user_id === payload.new.id
                ? { 
                    ...driver, 
                    account_status: payload.new.account_status,
                    is_active: payload.new.is_active,
                    email_verified: payload.new.email_verified,
                    approved_at: payload.new.approved_at,
                    rejected_at: payload.new.rejected_at,
                    rejection_reason: payload.new.rejection_reason
                  }
                : driver
            );
            calculateStats(updatedList);
            return updatedList;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(driversChannel);
      supabase.removeChannel(profileChannel);
    };
  }, []);

  // Approve a driver - UPDATED VERSION
  const approveDriver = async (driverId) => {
    try {
      // Get current admin user
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;
      
      if (!adminId) {
        throw new Error('Admin not authenticated');
      }

      // 1. Update drivers table
      const { error: driverError } = await supabase
        .from('drivers')
        .update({
          is_active: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          submitted_at: new Date().toISOString()
        })
        .eq('user_id', driverId);

      if (driverError) throw driverError;

      // 2. Update profiles table using admin client
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          account_status: 'approved',
          approved_at: new Date().toISOString(),
          rejected_at: null,
          rejection_reason: null,
          is_active: true
        })
        .eq('id', driverId);

      if (profileError) throw profileError;

      // 3. Call notification edge function
      const { error: notifError } = await supabase.functions.invoke('send-driver-notification', {
        body: {
          driverId: driverId,
          action: 'approved',
          reason: null,
          adminId: adminId
        }
      });

      if (notifError) {
        console.warn('Notification failed but driver approved:', notifError);
      }

      // 4. Log the approval action
      await supabase
        .from('driver_action_logs')
        .insert({
          driver_id: driverId,
          admin_id: adminId,
          action: 'approval',
          reason: 'Driver approved by admin',
          notes: 'Account fully activated',
          ip_address: null,
          user_agent: navigator.userAgent
        });

      // 5. Update local state IMMEDIATELY
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver.user_id === driverId || driver.id === driverId
            ? {
                ...driver,
                account_status: 'approved',
                is_active: true,
                approved_at: new Date().toISOString(),
                reviewed_at: new Date().toISOString(),
                rejected: false,
                rejection_reason: null,
                suspended: false,
                online: true // Auto-set to online when approved
              }
            : driver
        )
      );

      // Recalculate stats
      setDrivers(prev => {
        calculateStats(prev);
        return prev;
      });

      // 6. Show success with refresh reminder
      toast({
        title: '✅ Driver Approved',
        description: 'Driver has been approved and notified. They can now login.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });

      // 7. Refresh data after 2 seconds
      setTimeout(() => {
        fetchDrivers();
      }, 2000);

    } catch (error) {
      console.error('❌ Approval Error:', error);
      
      toast({
        title: '❌ Approval Failed',
        description: error.message || 'Failed to approve driver. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    }
  };

  // Reject a driver
  const handleRejectDriver = (driver) => {
    setSelectedDriver(driver);
    setRejectionReason('');
    setRejectModalVisible(true);
  };

  // Confirm reject driver - UPDATED VERSION
  const confirmRejectDriver = async () => {
    if (!selectedDriver) return;
    
    try {
      const driverId = selectedDriver.id || selectedDriver.user_id;
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;
      
      if (!adminId) {
        throw new Error('Admin not authenticated');
      }

      // 1. Update drivers table
      const { error: driverError } = await supabase
        .from('drivers')
        .update({
          is_active: false,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          notes: rejectionReason || 'Rejected by admin'
        })
        .eq('user_id', driverId);

      if (driverError) throw driverError;

      // 2. Update profiles table using admin client
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          account_status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'Rejected by admin',
          approved_at: null,
          is_active: false
        })
        .eq('id', driverId);

      if (profileError) throw profileError;

      // 3. Call notification edge function
      const { error: notifError } = await supabase.functions.invoke('send-driver-notification', {
        body: {
          driverId: driverId,
          action: 'rejected',
          reason: rejectionReason || 'Not specified',
          adminId: adminId
        }
      });

      if (notifError) {
        console.warn('Notification failed but driver rejected:', notifError);
      }

      // 4. Log the rejection action
      await supabase
        .from('driver_action_logs')
        .insert({
          driver_id: driverId,
          admin_id: adminId,
          action: 'rejection',
          reason: rejectionReason || 'Rejected by admin',
          notes: 'Driver account rejected',
          ip_address: null,
          user_agent: navigator.userAgent
        });

      // 5. Update local state IMMEDIATELY
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver.user_id === driverId || driver.id === driverId
            ? {
                ...driver,
                account_status: 'rejected',
                is_active: false,
                rejected_at: new Date().toISOString(),
                rejection_reason: rejectionReason || 'Rejected by admin',
                reviewed_at: new Date().toISOString(),
                approved_at: null,
                suspended: false,
                online: false
              }
            : driver
        )
      );

      // Recalculate stats
      setDrivers(prev => {
        calculateStats(prev);
        return prev;
      });

      // 6. Show success
      toast({
        title: '✅ Driver Rejected',
        description: 'Driver has been rejected and notified.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });

      // 7. Close modal and refresh
      setRejectModalVisible(false);
      setSelectedDriver(null);
      setRejectionReason('');

      // 8. Refresh data after 2 seconds
      setTimeout(() => {
        fetchDrivers();
      }, 2000);

    } catch (error) {
      console.error('❌ Rejection Error:', error);
      
      toast({
        title: '❌ Rejection Failed',
        description: error.message || 'Failed to reject driver. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    }
  };

  // Suspend a driver
  const handleSuspendDriver = (driver) => {
    setSelectedDriver(driver);
    setSuspensionReason('');
    setSuspendModalVisible(true);
  };

  const confirmSuspendDriver = async () => {
    if (!selectedDriver) return;
    
    try {
      const driverId = selectedDriver.id || selectedDriver.user_id;
      
      // Get admin ID for logging
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;

      // Update drivers table if exists
      const { data: driverExists } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', driverId)
        .single();
      
      if (driverExists) {
        await supabase
          .from('drivers')
          .update({
            suspended: true,
            suspension_reason: suspensionReason || 'Suspended by admin',
            suspended_at: new Date().toISOString(),
            reviewed_at: new Date().toISOString(),
            reviewed_by: adminId
          })
          .eq('user_id', driverId);

        // Log suspension action
        if (adminId) {
          await supabase
            .from('driver_action_logs')
            .insert({
              driver_id: driverId,
              admin_id: adminId,
              action: 'suspension',
              reason: suspensionReason || 'Suspended by admin',
              notes: 'Driver account suspended',
              ip_address: null,
              user_agent: navigator.userAgent
            });
        }
      }
      
      // Update profile using admin client
      await supabaseAdmin
        .from('profiles')
        .update({
          is_active: false
        })
        .eq('id', driverId);
      
      // Update local state
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver.id === driverId || driver.user_id === driverId
            ? {
                ...driver,
                suspended: true,
                suspension_reason: suspensionReason || 'Suspended by admin',
                suspended_at: new Date().toISOString(),
                is_active: false,
                reviewed_at: new Date().toISOString()
              }
            : driver
        )
      );

      // Recalculate stats
      setDrivers(prev => {
        calculateStats(prev);
        return prev;
      });
      
      setSuspendModalVisible(false);
      setSelectedDriver(null);
      setSuspensionReason('');
      
      toast({
        title: 'Success',
        description: 'Driver suspended successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error suspending driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to suspend driver. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Activate a suspended driver
  const activateDriver = async (driverId) => {
    try {
      // Get admin ID for logging
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = user?.id;

      // Update drivers table if exists
      const { data: driverExists } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', driverId)
        .single();
      
      if (driverExists) {
        await supabase
          .from('drivers')
          .update({
            suspended: false,
            suspension_reason: null,
            suspended_at: null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: adminId
          })
          .eq('user_id', driverId);

        // Log activation action
        if (adminId) {
          await supabase
            .from('driver_action_logs')
            .insert({
              driver_id: driverId,
              admin_id: adminId,
              action: 'activation',
              reason: 'Driver account reactivated',
              notes: 'Suspension lifted',
              ip_address: null,
              user_agent: navigator.userAgent
            });
        }
      }
      
      // Update profile using admin client
      await supabaseAdmin
        .from('profiles')
        .update({
          is_active: true
        })
        .eq('id', driverId);
      
      // Update local state
      setDrivers(prevDrivers =>
        prevDrivers.map(driver =>
          driver.id === driverId || driver.user_id === driverId
            ? {
                ...driver,
                suspended: false,
                suspension_reason: null,
                suspended_at: null,
                is_active: true,
                reviewed_at: new Date().toISOString()
              }
            : driver
        )
      );

      // Recalculate stats
      setDrivers(prev => {
        calculateStats(prev);
        return prev;
      });
      
      toast({
        title: 'Success',
        description: 'Driver activated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error activating driver:', error);
      toast({
        title: 'Error',
        description: 'Failed to activate driver. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  // Filter drivers based on search and filter
  const filteredDrivers = drivers.filter(driver => {
    // Apply search filter
    const matchesSearch = searchQuery === '' || 
      driver.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.vehicle?.plate_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    if (filter === 'pending') {
      return matchesSearch && driver.account_status === 'pending' && !driver.rejected && !driver.suspended;
    } else if (filter === 'approved') {
      return matchesSearch && driver.account_status === 'approved' && !driver.suspended;
    } else if (filter === 'suspended') {
      return matchesSearch && driver.suspended;
    } else if (filter === 'online') {
      return matchesSearch && driver.online && !driver.suspended;
    } else if (filter === 'offline') {
      return matchesSearch && !driver.online && !driver.suspended && driver.account_status === 'approved';
    }
    
    return matchesSearch; // 'all' filter
  });

  if (loading && !refreshing) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
        <Text ml={4} color="gray.600">Loading drivers...</Text>
      </Flex>
    );
  }

  return (
    <Box bg="gray.50" minH="100vh">
      {/* Header */}
      <Box bg={bgColor} borderBottomWidth="1px" borderColor={borderColor} px={6} py={4}>
        <Text fontSize="2xl" fontWeight="bold" color="gray.900" mb={4}>
          Driver Management
        </Text>
        
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="gray.900">{stats.total}</Text>
            <Text fontSize="sm" color="gray.600">Total</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="orange.500">{stats.pending}</Text>
            <Text fontSize="sm" color="gray.600">Pending</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.approved}</Text>
            <Text fontSize="sm" color="gray.600">Approved</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="red.500">{stats.suspended}</Text>
            <Text fontSize="sm" color="gray.600">Suspended</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="blue.500">{stats.online}</Text>
            <Text fontSize="sm" color="gray.600">Online</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="gray.500">{stats.offline}</Text>
            <Text fontSize="sm" color="gray.600">Offline</Text>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Filters and Search */}
      <Box bg={bgColor} borderBottomWidth="1px" borderColor={borderColor} p={4}>
        <Flex gap={4} mb={4}>
          <Input
            placeholder="Search drivers by name, email, phone, or plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="gray.50"
            leftIcon={<FaSearch />}
          />
          <IconButton
            icon={<FaSyncAlt />}
            onClick={onRefresh}
            isLoading={refreshing}
            aria-label="Refresh"
            colorScheme="blue"
          />
        </Flex>
        
        <Tabs variant="soft-rounded" colorScheme="blue" onChange={(index) => {
          const filters = ['pending', 'approved', 'suspended', 'online', 'offline', 'all'];
          setFilter(filters[index]);
        }}>
          <TabList>
            <Tab>Pending ({stats.pending})</Tab>
            <Tab>Approved ({stats.approved})</Tab>
            <Tab>Suspended ({stats.suspended})</Tab>
            <Tab>Online ({stats.online})</Tab>
            <Tab>Offline ({stats.offline})</Tab>
            <Tab>All ({stats.total})</Tab>
          </TabList>
        </Tabs>
      </Box>

      {/* Drivers List */}
      <Box p={4}>
        {filteredDrivers.length === 0 ? (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            {searchQuery ? 'No drivers match your search' : `No ${filter} drivers found`}
          </Alert>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {filteredDrivers.map((driver) => {
              if (filter === 'pending' && driver.account_status === 'pending' && !driver.rejected && !driver.suspended) {
                return (
                  <DriverApprovalCard
                    key={driver.id || driver.user_id}
                    driver={driver}
                    onApprove={() => approveDriver(driver.id || driver.user_id)}
                    onReject={() => handleRejectDriver(driver)}
                  />
                );
              } else {
                return (
                  <DriverCard
                    key={driver.id || driver.user_id}
                    driver={driver}
                    onSuspend={() => handleSuspendDriver(driver)}
                    onActivate={() => activateDriver(driver.id || driver.user_id)}
                  />
                );
              }
            })}
          </SimpleGrid>
        )}
      </Box>

      {/* Rejection Modal */}
      <Modal isOpen={rejectModalVisible} onClose={() => setRejectModalVisible(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Driver</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text color="gray.600">
                Rejecting: <strong>{selectedDriver?.full_name}</strong>
              </Text>
              <Textarea
                placeholder="Reason for rejection (optional)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setRejectModalVisible(false)}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmRejectDriver}>
              Reject Driver
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Suspension Modal */}
      <Modal isOpen={suspendModalVisible} onClose={() => setSuspendModalVisible(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Suspend Driver</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text color="gray.600">
                Suspending: <strong>{selectedDriver?.full_name}</strong>
              </Text>
              <Textarea
                placeholder="Reason for suspension (optional)"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={4}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setSuspendModalVisible(false)}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmSuspendDriver}>
              Suspend Driver
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}