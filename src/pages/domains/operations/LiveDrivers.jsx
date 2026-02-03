// File 27: src/pages/domains/operations/LiveDrivers.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon,
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
  Avatar,
  Divider,
} from '@chakra-ui/react';
import {
  PhoneIcon,
  ChatIcon,
  WarningIcon,
  CheckCircleIcon,
  TimeIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  ViewIcon,
  StarIcon,
  SettingsIcon,
  RepeatIcon,
} from '@chakra-ui/icons';
import { FaCar, FaMapMarkerAlt, FaWallet, FaChartLine } from 'react-icons/fa';
import { supabase } from '../../services/supabase';
import DataTable from '../../components/shared/DataTable';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { useRealTime } from '../../contexts/RealTimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import useUserManagement from '../../hooks/useUserManagement';
import useTripManagement from '../../hooks/useTripManagement';
import ConfirmationModal from '../../components/shared/ConfirmationModal';

const LiveDrivers = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { subscribeToTable, unsubscribe } = useRealTime();
  const { showNotification } = useNotification();
  const { getDrivers, updateDriverStatus, sendMessageToDriver } = useUserManagement();
  const { getDriverTrips } = useTripManagement();
  
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverStats, setDriverStats] = useState({
    online: 0,
    onTrip: 0,
    offline: 0,
    restricted: 0,
    total: 0,
  });
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });

  // Fetch initial drivers data
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getDrivers({
        status: 'all',
        includeDetails: true,
      });
      
      if (fetchError) throw fetchError;
      
      setDrivers(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setError('Failed to load drivers data');
      toast({
        title: 'Error',
        description: 'Failed to load drivers data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getDrivers, toast]);

  // Calculate driver statistics
  const calculateStats = (driverList) => {
    const stats = {
      online: 0,
      onTrip: 0,
      offline: 0,
      restricted: 0,
      total: driverList.length,
    };
    
    driverList.forEach(driver => {
      if (driver.is_restricted) {
        stats.restricted++;
      } else if (driver.current_status === 'online') {
        stats.online++;
        if (driver.current_trip_id) stats.onTrip++;
      } else if (driver.current_status === 'offline') {
        stats.offline++;
      }
    });
    
    setDriverStats(stats);
  };

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscribeToTable('drivers', (payload) => {
      console.log('Real-time driver update:', payload);
      
      setDrivers(prevDrivers => {
        const newDrivers = [...prevDrivers];
        const index = newDrivers.findIndex(d => d.id === payload.new.id);
        
        if (payload.eventType === 'DELETE') {
          if (index !== -1) {
            newDrivers.splice(index, 1);
          }
        } else if (index !== -1) {
          // Update existing driver
          newDrivers[index] = { ...newDrivers[index], ...payload.new };
        } else {
          // Add new driver
          newDrivers.push(payload.new);
        }
        
        calculateStats(newDrivers);
        return newDrivers;
      });
    });

    return () => {
      unsubscribe(subscription);
    };
  }, [subscribeToTable, unsubscribe]);

  // Fetch data on mount
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Handle driver actions
  const handleCallDriver = async (driver) => {
    if (!driver.phone) {
      toast({
        title: 'No phone number',
        description: 'This driver does not have a phone number registered',
        status: 'warning',
        duration: 3000,
      });
      return;
    }
    
    // Log the action
    try {
      const { error } = await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'call_driver',
        resource_type: 'driver',
        resource_id: driver.id,
        details: { driver_name: driver.full_name, phone: driver.phone },
        ip_address: 'admin_panel',
      });
      
      if (error) console.error('Failed to log action:', error);
    } catch (err) {
      console.error('Logging error:', err);
    }
    
    // Open phone dialer (simulated)
    window.open(`tel:${driver.phone}`);
  };

  const handleMessageDriver = async (driver) => {
    const message = prompt('Enter message to send to driver:');
    if (!message) return;
    
    setActionLoading(true);
    try {
      const { error } = await sendMessageToDriver(driver.id, message);
      
      if (error) throw error;
      
      toast({
        title: 'Message sent',
        description: 'Message has been sent to the driver',
        status: 'success',
        duration: 3000,
      });
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'message_driver',
        resource_type: 'driver',
        resource_id: driver.id,
        details: { driver_name: driver.full_name, message },
        ip_address: 'admin_panel',
      });
    } catch (err) {
      toast({
        title: 'Failed to send message',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestrictDriver = (driver) => {
    setSelectedDriver(driver);
    setModalConfig({
      title: driver.is_restricted ? 'Unrestrict Driver' : 'Restrict Driver',
      message: `Are you sure you want to ${driver.is_restricted ? 'unrestrict' : 'restrict'} ${driver.full_name}?`,
      action: driver.is_restricted ? 'unrestrict' : 'restrict',
      type: 'warning',
    });
    onOpen();
  };

  const confirmRestrictAction = async () => {
    if (!selectedDriver) return;
    
    setActionLoading(true);
    try {
      const newStatus = selectedDriver.is_restricted ? 'active' : 'restricted';
      const { error } = await updateDriverStatus(selectedDriver.id, newStatus);
      
      if (error) throw error;
      
      toast({
        title: 'Driver status updated',
        description: `${selectedDriver.full_name} has been ${selectedDriver.is_restricted ? 'unrestricted' : 'restricted'}`,
        status: 'success',
        duration: 3000,
      });
      
      // Update local state
      setDrivers(prev => prev.map(d => 
        d.id === selectedDriver.id 
          ? { ...d, is_restricted: !d.is_restricted }
          : d
      ));
      
      onClose();
    } catch (err) {
      toast({
        title: 'Failed to update driver',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
      setSelectedDriver(null);
    }
  };

  const handleViewDetails = (driver) => {
    // Navigate to driver detail page
    window.location.href = `/accounts/driver/${driver.id}`;
  };

  // Table columns configuration
  const columns = [
    {
      header: 'Driver',
      accessor: 'full_name',
      cell: (row) => (
        <HStack spacing={3}>
          <Avatar
            size="sm"
            name={row.full_name}
            src={row.profile_picture}
            bg="blue.500"
          />
          <Box>
            <Text fontWeight="medium">{row.full_name}</Text>
            <Text fontSize="sm" color="gray.500">
              ID: {row.driver_id}
            </Text>
          </Box>
        </HStack>
      ),
    },
    {
      header: 'Status',
      accessor: 'current_status',
      cell: (row) => {
        let colorScheme = 'gray';
        let icon = <TimeIcon />;
        
        if (row.is_restricted) {
          colorScheme = 'red';
          icon = <WarningIcon />;
        } else if (row.current_status === 'online') {
          colorScheme = row.current_trip_id ? 'purple' : 'green';
          icon = row.current_trip_id ? <FaCar /> : <CheckCircleIcon />;
        }
        
        return (
          <Badge colorScheme={colorScheme} display="flex" alignItems="center" gap={1} w="fit-content">
            {icon}
            {row.is_restricted ? 'Restricted' : 
             row.current_status === 'online' ? (row.current_trip_id ? 'On Trip' : 'Available') : 
             row.current_status || 'Offline'}
          </Badge>
        );
      },
    },
    {
      header: 'Vehicle',
      accessor: 'vehicle',
      cell: (row) => (
        row.vehicle ? (
          <VStack align="start" spacing={0}>
            <Text fontSize="sm">{row.vehicle.make} {row.vehicle.model}</Text>
            <Text fontSize="xs" color="gray.500">
              {row.vehicle.plate_number}
            </Text>
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500">No vehicle</Text>
        )
      ),
    },
    {
      header: 'Rating',
      accessor: 'rating',
      cell: (row) => (
        <HStack>
          <StarIcon color="yellow.500" />
          <Text>{row.rating?.toFixed(1) || 'N/A'}</Text>
          <Text fontSize="sm" color="gray.500">
            ({row.total_ratings || 0})
          </Text>
        </HStack>
      ),
    },
    {
      header: 'Trips Today',
      accessor: 'today_trips',
      cell: (row) => (
        <Stat size="sm">
          <StatNumber>{row.today_trips || 0}</StatNumber>
          <StatHelpText>
            ${row.today_earnings?.toFixed(2) || '0.00'}
          </StatHelpText>
        </Stat>
      ),
    },
    {
      header: 'Location',
      accessor: 'last_location',
      cell: (row) => (
        row.last_location ? (
          <HStack>
            <FaMapMarkerAlt color="#718096" />
            <Text fontSize="sm" isTruncated maxW="150px">
              {row.last_location.substring(0, 20)}...
            </Text>
          </HStack>
        ) : (
          <Text fontSize="sm" color="gray.500">Unknown</Text>
        )
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<SettingsIcon />}
            variant="ghost"
            size="sm"
            isLoading={actionLoading}
          />
          <MenuList>
            <MenuItem
              icon={<PhoneIcon />}
              onClick={() => handleCallDriver(row)}
              isDisabled={!hasPermission('driver', 'call')}
            >
              Call Driver
            </MenuItem>
            <MenuItem
              icon={<ChatIcon />}
              onClick={() => handleMessageDriver(row)}
              isDisabled={!hasPermission('driver', 'message')}
            >
              Send Message
            </MenuItem>
            <MenuItem
              icon={<ViewIcon />}
              onClick={() => handleViewDetails(row)}
            >
              View Details
            </MenuItem>
            <Divider />
            <MenuItem
              icon={row.is_restricted ? <CheckCircleIcon /> : <WarningIcon />}
              onClick={() => handleRestrictDriver(row)}
              color={row.is_restricted ? 'green.600' : 'red.600'}
              isDisabled={!hasPermission('driver', 'restrict')}
            >
              {row.is_restricted ? 'Unrestrict Driver' : 'Restrict Driver'}
            </MenuItem>
          </MenuList>
        </Menu>
      ),
    },
  ];

  // Stats cards for the top
  const renderStatsCards = () => (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4} mb={6}>
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Online Drivers</StatLabel>
            <StatNumber color="green.600">{driverStats.online}</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              {driverStats.onTrip} on trips
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>On Trips</StatLabel>
            <StatNumber color="purple.600">{driverStats.onTrip}</StatNumber>
            <Progress value={(driverStats.onTrip / driverStats.total) * 100} size="xs" mt={2} />
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Available</StatLabel>
            <StatNumber color="blue.600">{driverStats.online - driverStats.onTrip}</StatNumber>
            <StatHelpText>
              Ready for new trips
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Restricted</StatLabel>
            <StatNumber color="red.600">{driverStats.restricted}</StatNumber>
            <StatHelpText>
              {driverStats.restricted > 0 ? 'Needs attention' : 'All clear'}
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card>
        <CardBody>
          <Stat>
            <StatLabel>Total Drivers</StatLabel>
            <StatNumber>{driverStats.total}</StatNumber>
            <StatHelpText>
              In the system
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  if (loading && drivers.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading live drivers data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load drivers</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchDrivers} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">Live Drivers Monitor</Heading>
          <Text color="gray.600" mt={1}>
            Real-time monitoring of driver activity and status
          </Text>
        </Box>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={fetchDrivers}
          isLoading={loading}
        >
          Refresh
        </Button>
      </Flex>

      {renderStatsCards()}

      <Tabs variant="enclosed">
        <TabList>
          <Tab>All Drivers ({driverStats.total})</Tab>
          <Tab>Online ({driverStats.online})</Tab>
          <Tab>On Trips ({driverStats.onTrip})</Tab>
          <Tab>Restricted ({driverStats.restricted})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={drivers}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
              onRowClick={(row) => handleViewDetails(row)}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={drivers.filter(d => !d.is_restricted && d.current_status === 'online')}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={drivers.filter(d => !d.is_restricted && d.current_trip_id)}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={drivers.filter(d => d.is_restricted)}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={confirmRestrictAction}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={actionLoading}
      />
    </Box>
  );
};

export default LiveDrivers;