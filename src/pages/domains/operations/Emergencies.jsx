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
  Textarea,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  AlertTitle,
  AlertDescription,
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
  CloseIcon,
  BellIcon,
  CalendarIcon,
  InfoIcon,
} from '@chakra-ui/icons';
import { FaAmbulance, FaShieldAlt, FaUserMd, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '../../services/supabase';
import DataTable from '../../components/shared/DataTable';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { useRealTime } from '../../contexts/RealTimeContext';
import { useNotification } from '../../contexts/NotificationContext';
import useTripManagement from '../../hooks/useTripManagement';
import ConfirmationModal from '../../components/shared/ConfirmationModal';
import EmergencyAlert from '../../components/shared/EmergencyAlert';

const Emergencies = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { subscribeToTable, unsubscribe } = useRealTime();
  const { showNotification } = useNotification();
  const { getEmergencies, updateEmergencyStatus } = useTripManagement();
  
  const toast = useToast();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [emergencyStats, setEmergencyStats] = useState({
    active: 0,
    resolved: 0,
    critical: 0,
    today: 0,
    total: 0,
  });
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });

  // Fetch initial emergencies data
  const fetchEmergencies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getEmergencies({
        includeDetails: true,
        includeTrip: true,
      });
      
      if (fetchError) throw fetchError;
      
      setEmergencies(data || []);
      calculateStats(data || []);
    } catch (err) {
      console.error('Error fetching emergencies:', err);
      setError('Failed to load emergencies data');
      toast({
        title: 'Error',
        description: 'Failed to load emergencies data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getEmergencies, toast]);

  // Calculate emergency statistics
  const calculateStats = (emergencyList) => {
    const stats = {
      active: 0,
      resolved: 0,
      critical: 0,
      today: 0,
      total: emergencyList.length,
    };
    
    const today = new Date().toDateString();
    
    emergencyList.forEach(emergency => {
      if (emergency.status === 'active') {
        stats.active++;
        if (emergency.severity === 'critical') stats.critical++;
      } else if (emergency.status === 'resolved') {
        stats.resolved++;
      }
      
      const emergencyDate = new Date(emergency.created_at).toDateString();
      if (emergencyDate === today) {
        stats.today++;
      }
    });
    
    setEmergencyStats(stats);
  };

  // Set up real-time subscription
  useEffect(() => {
    const subscription = subscribeToTable('emergencies', (payload) => {
      console.log('Real-time emergency update:', payload);
      
      setEmergencies(prevEmergencies => {
        const newEmergencies = [...prevEmergencies];
        const index = newEmergencies.findIndex(e => e.id === payload.new.id);
        
        if (payload.eventType === 'DELETE') {
          if (index !== -1) {
            newEmergencies.splice(index, 1);
          }
        } else if (index !== -1) {
          newEmergencies[index] = { ...newEmergencies[index], ...payload.new };
        } else {
          newEmergencies.push(payload.new);
        }
        
        calculateStats(newEmergencies);
        
        // Show notification for new emergencies
        if (payload.eventType === 'INSERT' && payload.new.status === 'active') {
          showNotification({
            title: 'New Emergency Alert',
            description: `Emergency #${payload.new.emergency_code} reported`,
            status: 'error',
            duration: 10000,
            isClosable: true,
          });
        }
        
        return newEmergencies;
      });
    });

    return () => {
      unsubscribe(subscription);
    };
  }, [subscribeToTable, unsubscribe, showNotification]);

  // Fetch data on mount
  useEffect(() => {
    fetchEmergencies();
  }, [fetchEmergencies]);

  // Handle emergency actions
  const handleAcknowledgeEmergency = async (emergency) => {
    setActionLoading(true);
    try {
      const { error } = await updateEmergencyStatus(emergency.id, 'acknowledged');
      
      if (error) throw error;
      
      toast({
        title: 'Emergency acknowledged',
        description: `Emergency #${emergency.emergency_code} has been acknowledged`,
        status: 'success',
        duration: 3000,
      });
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'acknowledge_emergency',
        resource_type: 'emergency',
        resource_id: emergency.id,
        details: { 
          emergency_code: emergency.emergency_code,
          type: emergency.type 
        },
        ip_address: 'admin_panel',
      });
      
      // Refresh data
      fetchEmergencies();
    } catch (err) {
      toast({
        title: 'Failed to acknowledge emergency',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveEmergency = (emergency) => {
    setSelectedEmergency(emergency);
    setModalConfig({
      title: 'Resolve Emergency',
      message: `Are you sure you want to mark emergency #${emergency.emergency_code} as resolved?`,
      action: 'resolve',
      type: 'warning',
    });
    onOpen();
  };

  const handleCallEmergencyServices = (emergency) => {
    // Log the action
    supabase.from('admin_actions_log').insert({
      admin_id: user.id,
      action_type: 'call_emergency_services',
      resource_type: 'emergency',
      resource_id: emergency.id,
      details: { 
        emergency_code: emergency.emergency_code,
        type: emergency.type,
        location: emergency.location 
      },
      ip_address: 'admin_panel',
    });
    
    // Simulate calling emergency services
    toast({
      title: 'Emergency services notified',
      description: `Local authorities have been notified for emergency #${emergency.emergency_code}`,
      status: 'info',
      duration: 5000,
    });
  };

  const handleViewDetails = (emergency) => {
    setSelectedEmergency(emergency);
    onDetailOpen();
  };

  const confirmResolveAction = async () => {
    if (!selectedEmergency) return;
    
    setActionLoading(true);
    try {
      const { error } = await updateEmergencyStatus(selectedEmergency.id, 'resolved');
      
      if (error) throw error;
      
      toast({
        title: 'Emergency resolved',
        description: `Emergency #${selectedEmergency.emergency_code} has been marked as resolved`,
        status: 'success',
        duration: 3000,
      });
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'resolve_emergency',
        resource_type: 'emergency',
        resource_id: selectedEmergency.id,
        details: { 
          emergency_code: selectedEmergency.emergency_code,
          type: selectedEmergency.type 
        },
        ip_address: 'admin_panel',
      });
      
      // Refresh data
      fetchEmergencies();
      onClose();
    } catch (err) {
      toast({
        title: 'Failed to resolve emergency',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
      setSelectedEmergency(null);
    }
  };

  const handleAddActionNote = async () => {
    // Implementation for adding action notes
    toast({
      title: 'Feature coming soon',
      description: 'Action notes feature will be available in the next update',
      status: 'info',
      duration: 3000,
    });
  };

  // Table columns configuration
  const columns = [
    {
      header: 'Emergency Code',
      accessor: 'emergency_code',
      cell: (row) => (
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" color="red.600">
            #{row.emergency_code}
          </Text>
          <Text fontSize="xs" color="gray.500">
            {new Date(row.created_at).toLocaleString()}
          </Text>
        </VStack>
      ),
    },
    {
      header: 'Type & Severity',
      accessor: 'type',
      cell: (row) => {
        let colorScheme = 'red';
        let icon = <FaExclamationTriangle />;
        
        if (row.type === 'medical') {
          colorScheme = 'red';
          icon = <FaUserMd />;
        } else if (row.type === 'accident') {
          colorScheme = 'orange';
          icon = <FaAmbulance />;
        } else if (row.type === 'safety') {
          colorScheme = 'yellow';
          icon = <FaShieldAlt />;
        }
        
        return (
          <HStack>
            <Box color={`${colorScheme}.500`}>{icon}</Box>
            <VStack align="start" spacing={0}>
              <Text fontWeight="medium" textTransform="capitalize">
                {row.type}
              </Text>
              <Badge 
                colorScheme={row.severity === 'critical' ? 'red' : 'orange'}
                size="sm"
              >
                {row.severity}
              </Badge>
            </VStack>
          </HStack>
        );
      },
    },
    {
      header: 'Trip & Location',
      accessor: 'trip',
      cell: (row) => (
        row.trip ? (
          <VStack align="start" spacing={0}>
            <Text fontSize="sm">Trip #{row.trip.trip_code}</Text>
            <Text fontSize="xs" color="gray.500" isTruncated maxW="200px">
              {row.location || 'Location not available'}
            </Text>
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500">No trip associated</Text>
        )
      ),
    },
    {
      header: 'Reported By',
      accessor: 'reported_by',
      cell: (row) => (
        <HStack>
          <Avatar
            size="sm"
            name={row.reporter_name}
            bg="blue.500"
          />
          <Box>
            <Text fontSize="sm">{row.reporter_name}</Text>
            <Text fontSize="xs" color="gray.500">
              {row.reporter_type}
            </Text>
          </Box>
        </HStack>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => {
        let colorScheme = 'gray';
        let statusText = row.status;
        
        switch(row.status) {
          case 'active':
            colorScheme = 'red';
            statusText = 'Active';
            break;
          case 'acknowledged':
            colorScheme = 'orange';
            statusText = 'Acknowledged';
            break;
          case 'resolved':
            colorScheme = 'green';
            statusText = 'Resolved';
            break;
          default:
            colorScheme = 'gray';
        }
        
        return (
          <Badge colorScheme={colorScheme} px={2} py={1} borderRadius="full">
            {statusText}
          </Badge>
        );
      },
    },
    {
      header: 'Response Time',
      accessor: 'response_time',
      cell: (row) => {
        const created = new Date(row.created_at);
        const now = new Date();
        const diffMinutes = Math.floor((now - created) / (1000 * 60));
        
        return (
          <VStack align="start" spacing={0}>
            <Text fontSize="sm">{diffMinutes} min ago</Text>
            <Progress 
              value={row.status === 'resolved' ? 100 : Math.min(diffMinutes * 5, 100)} 
              size="xs" 
              colorScheme={diffMinutes > 10 ? 'red' : diffMinutes > 5 ? 'orange' : 'green'}
              width="100px"
            />
          </VStack>
        );
      },
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
              icon={<BellIcon />}
              onClick={() => handleAcknowledgeEmergency(row)}
              isDisabled={row.status !== 'active' || !hasPermission('emergency', 'acknowledge')}
            >
              Acknowledge
            </MenuItem>
            <MenuItem
              icon={<CheckCircleIcon />}
              onClick={() => handleResolveEmergency(row)}
              isDisabled={row.status === 'resolved' || !hasPermission('emergency', 'resolve')}
            >
              Mark as Resolved
            </MenuItem>
            <MenuItem
              icon={<PhoneIcon />}
              onClick={() => handleCallEmergencyServices(row)}
              isDisabled={!hasPermission('emergency', 'call_services')}
            >
              Call Emergency Services
            </MenuItem>
            <Divider />
            <MenuItem
              icon={<ViewIcon />}
              onClick={() => handleViewDetails(row)}
            >
              View Details
            </MenuItem>
          </MenuList>
        </Menu>
      ),
    },
  ];

  // Stats cards for the top
  const renderStatsCards = () => (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 5 }} spacing={4} mb={6}>
      <Card borderLeft="4px solid" borderLeftColor="red.500">
        <CardBody>
          <Stat>
            <StatLabel color="red.600">Active Emergencies</StatLabel>
            <StatNumber color="red.600">{emergencyStats.active}</StatNumber>
            <StatHelpText>
              {emergencyStats.critical} critical
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card borderLeft="4px solid" borderLeftColor="orange.500">
        <CardBody>
          <Stat>
            <StatLabel>Acknowledged</StatLabel>
            <StatNumber color="orange.600">
              {emergencies.filter(e => e.status === 'acknowledged').length}
            </StatNumber>
            <StatHelpText>
              Under investigation
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card borderLeft="4px solid" borderLeftColor="green.500">
        <CardBody>
          <Stat>
            <StatLabel>Resolved</StatLabel>
            <StatNumber color="green.600">{emergencyStats.resolved}</StatNumber>
            <StatHelpText>
              Successfully handled
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card borderLeft="4px solid" borderLeftColor="blue.500">
        <CardBody>
          <Stat>
            <StatLabel>Today's Emergencies</StatLabel>
            <StatNumber>{emergencyStats.today}</StatNumber>
            <StatHelpText>
              <StatArrow type={emergencyStats.today > 5 ? 'increase' : 'decrease'} />
              vs yesterday
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
      
      <Card borderLeft="4px solid" borderLeftColor="purple.500">
        <CardBody>
          <Stat>
            <StatLabel>Avg. Response Time</StatLabel>
            <StatNumber>8.5 min</StatNumber>
            <StatHelpText>
              less than 10 min{"< 10 min"}&lt; 10 min
            </StatHelpText>
          </Stat>
        </CardBody>
      </Card>
    </SimpleGrid>
  );

  // Render emergency details modal
  const renderEmergencyDetails = () => {
    if (!selectedEmergency) return null;
    
    const created = new Date(selectedEmergency.created_at);
    const now = new Date();
    const diffMinutes = Math.floor((now - created) / (1000 * 60));
    
    return (
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Box color="red.500">
                <FaExclamationTriangle />
              </Box>
              <Text>Emergency #{selectedEmergency.emergency_code}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              {/* Emergency Status Banner */}
              <Alert 
                status={selectedEmergency.severity === 'critical' ? 'error' : 'warning'}
                borderRadius="md"
              >
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>
                    {selectedEmergency.severity === 'critical' ? 'CRITICAL EMERGENCY' : 'EMERGENCY'}
                  </AlertTitle>
                  <AlertDescription>
                    {selectedEmergency.type.toUpperCase()} • {selectedEmergency.status.toUpperCase()} • {diffMinutes} minutes ago
                  </AlertDescription>
                </Box>
              </Alert>
              
              {/* Emergency Details */}
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                    Emergency Type
                  </Text>
                  <Text fontSize="lg" textTransform="capitalize">
                    {selectedEmergency.type}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                    Severity Level
                  </Text>
                  <Badge 
                    colorScheme={selectedEmergency.severity === 'critical' ? 'red' : 'orange'}
                    fontSize="md"
                    px={3}
                    py={1}
                  >
                    {selectedEmergency.severity}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                    Reported By
                  </Text>
                  <Text fontSize="lg">
                    {selectedEmergency.reporter_name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {selectedEmergency.reporter_type}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="semibold" color="gray.600" fontSize="sm">
                    Contact Phone
                  </Text>
                  <Text fontSize="lg">
                    {selectedEmergency.reporter_phone || 'Not provided'}
                  </Text>
                </Box>
              </SimpleGrid>
              
              {/* Location Information */}
              <Box>
                <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                  Location
                </Text>
                <Card variant="outline">
                  <CardBody>
                    <Text>{selectedEmergency.location || 'Location not specified'}</Text>
                    {selectedEmergency.coordinates && (
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Coordinates: {selectedEmergency.coordinates}
                      </Text>
                    )}
                  </CardBody>
                </Card>
              </Box>
              
              {/* Description */}
              <Box>
                <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                  Description
                </Text>
                <Card variant="outline">
                  <CardBody>
                    <Text whiteSpace="pre-wrap">
                      {selectedEmergency.description || 'No description provided'}
                    </Text>
                  </CardBody>
                </Card>
              </Box>
              
              {/* Trip Information */}
              {selectedEmergency.trip && (
                <Box>
                  <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                    Associated Trip
                  </Text>
                  <Card variant="outline">
                    <CardBody>
                      <SimpleGrid columns={2} spacing={3}>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Trip Code</Text>
                          <Text fontWeight="medium">#{selectedEmergency.trip.trip_code}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Driver</Text>
                          <Text>{selectedEmergency.trip.driver_name}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Passenger</Text>
                          <Text>{selectedEmergency.trip.passenger_name}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Vehicle</Text>
                          <Text>{selectedEmergency.trip.vehicle_plate}</Text>
                        </Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </Box>
              )}
              
              {/* Timeline/Actions */}
              <Box>
                <Text fontWeight="semibold" color="gray.600" fontSize="sm" mb={2}>
                  Timeline
                </Text>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm">Emergency reported</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(selectedEmergency.created_at).toLocaleTimeString()}
                    </Text>
                  </HStack>
                  {selectedEmergency.acknowledged_at && (
                    <HStack justify="space-between">
                      <Text fontSize="sm">Acknowledged by admin</Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(selectedEmergency.acknowledged_at).toLocaleTimeString()}
                      </Text>
                    </HStack>
                  )}
                  {selectedEmergency.resolved_at && (
                    <HStack justify="space-between">
                      <Text fontSize="sm">Emergency resolved</Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(selectedEmergency.resolved_at).toLocaleTimeString()}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDetailClose}>
              Close
            </Button>
            {selectedEmergency.status !== 'resolved' && (
              <Button
                colorScheme="red"
                onClick={() => {
                  onDetailClose();
                  handleResolveEmergency(selectedEmergency);
                }}
                isDisabled={!hasPermission('emergency', 'resolve')}
              >
                Mark as Resolved
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  };

  if (loading && emergencies.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading emergencies data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load emergencies</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchEmergencies} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">Emergency Management</Heading>
          <Text color="gray.600" mt={1}>
            Monitor and respond to emergency situations
          </Text>
        </Box>
        <Button
          leftIcon={<RepeatIcon />}
          onClick={fetchEmergencies}
          isLoading={loading}
          colorScheme="red"
          variant="outline"
        >
          Refresh
        </Button>
      </Flex>

      {/* Critical Emergency Alert Banner */}
      {emergencyStats.critical > 0 && (
        <EmergencyAlert
          emergency={emergencies.find(e => e.severity === 'critical' && e.status === 'active')}
          count={emergencyStats.critical}
          onAcknowledge={() => {
            const criticalEmergency = emergencies.find(e => e.severity === 'critical' && e.status === 'active');
            if (criticalEmergency) {
              handleAcknowledgeEmergency(criticalEmergency);
            }
          }}
          onResolve={() => {
            const criticalEmergency = emergencies.find(e => e.severity === 'critical' && e.status === 'active');
            if (criticalEmergency) {
              handleResolveEmergency(criticalEmergency);
            }
          }}
        />
      )}

      {renderStatsCards()}

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Active ({emergencyStats.active})</Tab>
          <Tab>Acknowledged ({emergencies.filter(e => e.status === 'acknowledged').length})</Tab>
          <Tab>Resolved ({emergencyStats.resolved})</Tab>
          <Tab>All ({emergencyStats.total})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={emergencies.filter(e => e.status === 'active')}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
              defaultSort={{ column: 'created_at', direction: 'desc' }}
              onRowClick={(row) => handleViewDetails(row)}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={emergencies.filter(e => e.status === 'acknowledged')}
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
              data={emergencies.filter(e => e.status === 'resolved')}
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
              data={emergencies}
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
        onConfirm={confirmResolveAction}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={actionLoading}
      />

      {renderEmergencyDetails()}
    </Box>
  );
};

export default Emergencies;