import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Switch,
  Select,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Heading,
  Badge,
  Icon,
  Tooltip,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Tag,
  TagLabel,
  TagCloseButton,
  Avatar,
  AvatarGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Code,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Checkbox,
  CheckboxGroup,
  Stack,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Radio,
  RadioGroup,
  Image,
  Wrap,
  WrapItem,
  IconButton,
} from '@chakra-ui/react';
import { 
  FaUserCheck, 
  FaUserTimes, 
  FaUserClock, 
  FaCar,
  FaIdCard,
  FaPhone,
  FaCamera,
  FaFileUpload,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaBan,
  FaSync,
  FaFilter,
  FaSortAmountDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaDownload,
  FaUpload,
  FaHistory,
  FaChartLine,
  FaShieldAlt,
  FaMoneyBillWave,
  FaRoute,
  FaMapMarkerAlt,
  FaUserTag,
  FaEnvelope,
  FaBell,
  FaCog,
  FaSearch,
  FaPlus,
  FaUndo,
  FaPlay,
  FaStop,
  FaPause,
  FaDatabase,
  FaServer,
  FaPaperPlane,
  FaVolumeUp,
  FaVolumeMute,
  FaSave,
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer';
import SettingsMenu from '../../components/SettingsMenu';
import { supabase } from '../../services/supabase';

const DriverRules = () => {
  const toast = useToast();
  
  // Driver rules state
  const [driverRules, setDriverRules] = useState({
    min_age: 21,
    min_driving_experience: 2,
    national_id_required: true,
    driver_license_required: true,
    vehicle_registration_required: true,
    vehicle_photos_required: true,
    phone_verification_required: true,
    profile_photo_required: true,
    criminal_record_check: false,
    background_check: false,
    min_rating_for_activation: 4.0,
    max_allowed_rating: 4.5,
    auto_suspend_below_rating: 3.0,
    auto_ban_below_rating: 2.0,
    max_complaints_before_suspension: 3,
    max_complaints_before_ban: 5,
    document_expiry_check: true,
    document_expiry_days: 30,
    training_required: false,
    training_hours: 8,
  });
  
  // Driver status management
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [suspendedDrivers, setSuspendedDrivers] = useState([]);
  const [bannedDrivers, setBannedDrivers] = useState([]);
  
  // Loading and saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Selected driver for actions
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedAction, setSelectedAction] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  
  // Document verification
  const [selectedDocuments, setSelectedDocuments] = useState(null);
  
  // Modals
  const { isOpen: isActionModalOpen, onOpen: onActionModalOpen, onClose: onActionModalClose } = useDisclosure();
  const { isOpen: isDocumentsModalOpen, onOpen: onDocumentsModalOpen, onClose: onDocumentsModalClose } = useDisclosure();
  const { isOpen: isRuleModalOpen, onOpen: onRuleModalOpen, onClose: onRuleModalClose } = useDisclosure();
  const { isOpen: isBulkModalOpen, onOpen: onBulkModalOpen, onClose: onBulkModalClose } = useDisclosure();
  const { isOpen: isStatsModalOpen, onOpen: onStatsModalOpen, onClose: onStatsModalClose } = useDisclosure();
  
  // Bulk actions
  const [bulkAction, setBulkAction] = useState('');
  const [selectedDriverIds, setSelectedDriverIds] = useState([]);
  
  // Statistics
  const [driverStats, setDriverStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    suspended: 0,
    banned: 0,
    approval_rate: 0,
    avg_rating: 0,
    avg_response_time: 0,
  });
  
  // Fetch driver rules
  const fetchDriverRules = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('driver_rules')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setDriverRules(data);
      }
      
    } catch (error) {
      console.error('Error fetching driver rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load driver rules',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch drivers by status
  const fetchDriversByStatus = async () => {
    try {
      setDriversLoading(true);
      
      // Fetch pending drivers
      const { data: pendingData, error: pendingError } = await supabase
        .from('drivers')
        .select(`
          *,
          user:user_id (
            email,
            full_name,
            phone,
            avatar_url
          ),
          vehicle:vehicle_id (
            make,
            model,
            year,
            plate_number
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (!pendingError && pendingData) {
        setPendingDrivers(pendingData);
      }
      
      // Fetch active drivers
      const { data: activeData, error: activeError } = await supabase
        .from('drivers')
        .select(`
          *,
          user:user_id (
            email,
            full_name,
            phone,
            avatar_url
          ),
          vehicle:vehicle_id (
            make,
            model,
            year,
            plate_number
          )
        `)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });
      
      if (!activeError && activeData) {
        setActiveDrivers(activeData);
      }
      
      // Fetch suspended drivers
      const { data: suspendedData, error: suspendedError } = await supabase
        .from('drivers')
        .select(`
          *,
          user:user_id (
            email,
            full_name,
            phone,
            avatar_url
          ),
          vehicle:vehicle_id (
            make,
            model,
            year,
            plate_number
          )
        `)
        .eq('status', 'suspended')
        .order('suspended_at', { ascending: false });
      
      if (!suspendedError && suspendedData) {
        setSuspendedDrivers(suspendedData);
      }
      
      // Fetch banned drivers
      const { data: bannedData, error: bannedError } = await supabase
        .from('drivers')
        .select(`
          *,
          user:user_id (
            email,
            full_name,
            phone,
            avatar_url
          ),
          vehicle:vehicle_id (
            make,
            model,
            year,
            plate_number
          )
        `)
        .eq('status', 'banned')
        .order('banned_at', { ascending: false });
      
      if (!bannedError && bannedData) {
        setBannedDrivers(bannedData);
      }
      
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setDriversLoading(false);
    }
  };
  
  // Fetch driver statistics
  const fetchDriverStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_driver_statistics');
      
      if (!error && data) {
        setDriverStats(data);
      }
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    }
  };
  
  // Save driver rules
  const saveDriverRules = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('driver_rules')
        .upsert({
          ...driverRules,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Driver rules saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error saving driver rules:', error);
      toast({
        title: 'Error',
        description: 'Failed to save driver rules',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Perform driver action (approve, suspend, ban, etc.)
  const performDriverAction = async () => {
    if (!selectedDriver || !selectedAction) {
      toast({
        title: 'Validation Error',
        description: 'Please select a driver and action',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setActionLoading(true);
      
      const user = await supabase.auth.getUser();
      const adminId = user.data.user?.id;
      const now = new Date().toISOString();
      
      let updateData = {};
      let notificationType = '';
      let notificationMessage = '';
      
      switch (selectedAction) {
        case 'approve':
          updateData = {
            status: 'approved',
            approved_at: now,
            approved_by: adminId,
            suspension_reason: null,
            banned_at: null,
            banned_by: null,
            ban_reason: null,
          };
          notificationType = 'driver_approved';
          notificationMessage = `Driver ${selectedDriver.user?.full_name} has been approved`;
          break;
          
        case 'reject':
          updateData = {
            status: 'rejected',
            rejected_at: now,
            rejected_by: adminId,
            rejection_reason: actionReason,
          };
          notificationType = 'driver_rejected';
          notificationMessage = `Driver ${selectedDriver.user?.full_name} has been rejected: ${actionReason}`;
          break;
          
        case 'suspend':
          updateData = {
            status: 'suspended',
            suspended_at: now,
            suspended_by: adminId,
            suspension_reason: actionReason,
            suspension_notes: actionNotes,
          };
          notificationType = 'driver_suspended';
          notificationMessage = `Driver ${selectedDriver.user?.full_name} has been suspended: ${actionReason}`;
          break;
          
        case 'ban':
          updateData = {
            status: 'banned',
            banned_at: now,
            banned_by: adminId,
            ban_reason: actionReason,
            ban_notes: actionNotes,
          };
          notificationType = 'driver_banned';
          notificationMessage = `Driver ${selectedDriver.user?.full_name} has been banned: ${actionReason}`;
          break;
          
        case 'reactivate':
          updateData = {
            status: 'active',
            suspension_reason: null,
            suspended_at: null,
            suspended_by: null,
          };
          notificationType = 'driver_reactivated';
          notificationMessage = `Driver ${selectedDriver.user?.full_name} has been reactivated`;
          break;
          
        case 'request_documents':
          // In production, this would trigger a notification to upload more documents
          notificationType = 'document_request';
          notificationMessage = `Driver ${selectedDriver.user?.full_name} has been requested to upload additional documents`;
          break;
      }
      
      // Update driver status
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('drivers')
          .update(updateData)
          .eq('id', selectedDriver.id);
        
        if (error) throw error;
      }
      
      // Log the action
      await supabase
        .from('driver_action_logs')
        .insert({
          driver_id: selectedDriver.id,
          admin_id: adminId,
          action: selectedAction,
          reason: actionReason,
          notes: actionNotes,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
        });
      
      // Send notification to driver (in production)
      if (notificationType && selectedDriver.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: selectedDriver.user_id,
            type: notificationType,
            title: 'Driver Status Update',
            message: notificationMessage,
            data: {
              driver_id: selectedDriver.id,
              action: selectedAction,
              reason: actionReason,
            },
          });
      }
      
      toast({
        title: 'Success',
        description: `Driver ${selectedAction} action completed successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset and refresh
      setSelectedDriver(null);
      setSelectedAction('');
      setActionReason('');
      setActionNotes('');
      onActionModalClose();
      fetchDriversByStatus();
      fetchDriverStats();
      
    } catch (error) {
      console.error('Error performing driver action:', error);
      toast({
        title: 'Error',
        description: `Failed to ${selectedAction} driver`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // View driver documents
  const viewDriverDocuments = async (driverId) => {
    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setSelectedDocuments(data);
        onDocumentsModalOpen();
      }
    } catch (error) {
      console.error('Error fetching driver documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load driver documents',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Perform bulk action
  const performBulkAction = async () => {
    if (!bulkAction || selectedDriverIds.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select drivers and an action',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setActionLoading(true);
      
      const user = await supabase.auth.getUser();
      const adminId = user.data.user?.id;
      const now = new Date().toISOString();
      
      let updateData = {};
      
      switch (bulkAction) {
        case 'approve_all':
          updateData = {
            status: 'approved',
            approved_at: now,
            approved_by: adminId,
          };
          break;
          
        case 'suspend_low_rating':
          updateData = {
            status: 'suspended',
            suspended_at: now,
            suspended_by: adminId,
            suspension_reason: 'Low rating (bulk action)',
          };
          break;
      }
      
      // Update multiple drivers
      const { error } = await supabase
        .from('drivers')
        .update(updateData)
        .in('id', selectedDriverIds);
      
      if (error) throw error;
      
      // Log bulk action
      await supabase
        .from('driver_action_logs')
        .insert({
          admin_id: adminId,
          action: `bulk_${bulkAction}`,
          reason: `Bulk action performed on ${selectedDriverIds.length} drivers`,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
        });
      
      toast({
        title: 'Success',
        description: `Bulk action completed on ${selectedDriverIds.length} drivers`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset and refresh
      setBulkAction('');
      setSelectedDriverIds([]);
      onBulkModalClose();
      fetchDriversByStatus();
      fetchDriverStats();
      
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Toggle driver selection for bulk actions
  const toggleDriverSelection = (driverId) => {
    if (selectedDriverIds.includes(driverId)) {
      setSelectedDriverIds(selectedDriverIds.filter(id => id !== driverId));
    } else {
      setSelectedDriverIds([...selectedDriverIds, driverId]);
    }
  };
  
  // Select all drivers in current tab
  const selectAllDrivers = (drivers) => {
    const allIds = drivers.map(driver => driver.id);
    setSelectedDriverIds(allIds);
  };
  
  // Deselect all drivers
  const deselectAllDrivers = () => {
    setSelectedDriverIds([]);
  };
  
  // Handle rule change
  const handleRuleChange = (key, value) => {
    setDriverRules(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Open action modal with driver and action
  const openActionModal = (driver, action) => {
    setSelectedDriver(driver);
    setSelectedAction(action);
    setActionReason('');
    setActionNotes('');
    onActionModalOpen();
  };
  
  // Get client IP (simplified)
  const getClientIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  };
  
  // Refresh all data
  const handleRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchDriverRules(), fetchDriversByStatus(), fetchDriverStats()])
      .finally(() => setTimeout(() => setRefreshing(false), 1000));
  };
  
  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'blue';
      case 'active': return 'green';
      case 'suspended': return 'orange';
      case 'banned': return 'red';
      case 'rejected': return 'gray';
      default: return 'gray';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return FaUserClock;
      case 'approved': return FaUserCheck;
      case 'active': return FaUserCheck;
      case 'suspended': return FaUserTimes;
      case 'banned': return FaBan;
      case 'rejected': return FaTimesCircle;
      default: return FaUserClock;
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    Promise.all([fetchDriverRules(), fetchDriversByStatus(), fetchDriverStats()]);
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('driver_rules_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'driver_rules' }, 
        fetchDriverRules
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'drivers' }, 
        () => {
          fetchDriversByStatus();
          fetchDriverStats();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return (
      <PageContainer title="Driver Management Rules" subtitle="Configure driver requirements, approval workflow, and management rules">
        <Flex gap={6}>
          <SettingsMenu />
          <Box flex={1} display="flex" alignItems="center" justifyContent="center" minH="400px">
            <Text>Loading driver rules...</Text>
          </Box>
        </Flex>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      title="Driver Management Rules" 
      subtitle="Configure driver requirements, approval workflow, suspension logic, and management rules"
    >
      <Flex gap={6}>
        <SettingsMenu />
        
        <Box flex={1}>
          {/* Header with stats */}
          <Card mb={6} borderColor="gray.200">
            <CardBody>
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="md" color="gray.800">
                    Driver Management Dashboard
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    {driverStats.total} total drivers • {driverStats.pending} pending • {driverStats.active} active
                  </Text>
                </Box>
                <HStack spacing={3}>
                  <Button
                    leftIcon={<FaSync />}
                    colorScheme="gray"
                    variant="outline"
                    size="sm"
                    isLoading={refreshing}
                    onClick={handleRefresh}
                  >
                    Refresh
                  </Button>
                  <Button
                    leftIcon={<FaChartLine />}
                    colorScheme="brand"
                    size="sm"
                    onClick={onStatsModalOpen}
                  >
                    View Stats
                  </Button>
                  <Button
                    leftIcon={<FaCog />}
                    colorScheme="brand"
                    size="sm"
                    onClick={onRuleModalOpen}
                  >
                    Configure Rules
                  </Button>
                </HStack>
              </Flex>
            </CardBody>
          </Card>
          
          <Tabs colorScheme="brand">
            <TabList>
              <Tab fontWeight="semibold">
                <Icon as={FaUserClock} mr={2} />
                Pending Approval ({pendingDrivers.length})
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaUserCheck} mr={2} />
                Active Drivers ({activeDrivers.length})
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaUserTimes} mr={2} />
                Suspended ({suspendedDrivers.length})
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaBan} mr={2} />
                Banned ({bannedDrivers.length})
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaShieldAlt} mr={2} />
                Rules & Requirements
              </Tab>
            </TabList>
            
            <TabPanels>
              {/* Tab 1: Pending Approval */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Pending Driver Applications</Heading>
                        <HStack spacing={2}>
                          {selectedDriverIds.length > 0 && (
                            <Badge colorScheme="brand" fontSize="sm" px={2} py={1}>
                              {selectedDriverIds.length} selected
                            </Badge>
                          )}
                          <Button
                            leftIcon={<FaPlay />}
                            colorScheme="green"
                            size="sm"
                            onClick={() => {
                              if (selectedDriverIds.length > 0) {
                                setBulkAction('approve_all');
                                onBulkModalOpen();
                              } else {
                                toast({
                                  title: 'No drivers selected',
                                  description: 'Please select drivers to approve',
                                  status: 'warning',
                                  duration: 3000,
                                });
                              }
                            }}
                            isDisabled={selectedDriverIds.length === 0}
                          >
                            Approve Selected
                          </Button>
                          <Button
                            leftIcon={<FaCog />}
                            colorScheme="gray"
                            variant="outline"
                            size="sm"
                            onClick={onBulkModalOpen}
                          >
                            Bulk Actions
                          </Button>
                        </HStack>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {driversLoading ? (
                        <Box textAlign="center" py={8}>
                          <Text>Loading pending drivers...</Text>
                        </Box>
                      ) : pendingDrivers.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No pending drivers</AlertTitle>
                            <AlertDescription>
                              All driver applications have been processed.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th w="50px">
                                <Checkbox
                                  isChecked={selectedDriverIds.length === pendingDrivers.length && pendingDrivers.length > 0}
                                  onChange={() => {
                                    if (selectedDriverIds.length === pendingDrivers.length) {
                                      deselectAllDrivers();
                                    } else {
                                      selectAllDrivers(pendingDrivers);
                                    }
                                  }}
                                />
                              </Th>
                              <Th>Driver</Th>
                              <Th>Vehicle</Th>
                              <Th>Documents</Th>
                              <Th>Applied</Th>
                              <Th textAlign="right">Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {pendingDrivers.map((driver) => (
                              <Tr key={driver.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <Checkbox
                                    isChecked={selectedDriverIds.includes(driver.id)}
                                    onChange={() => toggleDriverSelection(driver.id)}
                                  />
                                </Td>
                                <Td>
                                  <HStack>
                                    <Avatar
                                      size="sm"
                                      name={driver.user?.full_name || driver.user?.email}
                                      src={driver.user?.avatar_url}
                                      bg="brand.500"
                                    />
                                    <Box>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {driver.user?.full_name || 'No Name'}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {driver.user?.email}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {driver.user?.phone}
                                      </Text>
                                    </Box>
                                  </HStack>
                                </Td>
                                <Td>
                                  {driver.vehicle ? (
                                    <Box>
                                      <Text fontSize="sm">
                                        {driver.vehicle.make} {driver.vehicle.model} ({driver.vehicle.year})
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {driver.vehicle.plate_number}
                                      </Text>
                                    </Box>
                                  ) : (
                                    <Text fontSize="sm" color="gray.500">
                                      No vehicle info
                                    </Text>
                                  )}
                                </Td>
                                <Td>
                                  <Button
                                    size="xs"
                                    colorScheme="blue"
                                    variant="outline"
                                    leftIcon={<FaEye />}
                                    onClick={() => viewDriverDocuments(driver.id)}
                                  >
                                    View Documents
                                  </Button>
                                </Td>
                                <Td>
                                  <Text fontSize="xs" color="gray.600">
                                    {new Date(driver.created_at).toLocaleDateString()}
                                  </Text>
                                </Td>
                                <Td>
                                  <HStack spacing={2} justify="flex-end">
                                    <Tooltip label="Approve Driver">
                                      <IconButton
                                        icon={<FaCheckCircle />}
                                        colorScheme="green"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Approve Driver"
                                        onClick={() => openActionModal(driver, 'approve')}
                                      />
                                    </Tooltip>
                                    <Tooltip label="Reject Driver">
                                      <IconButton
                                        icon={<FaTimesCircle />}
                                        colorScheme="red"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Reject Driver"
                                        onClick={() => openActionModal(driver, 'reject')}
                                      />
                                    </Tooltip>
                                    <Tooltip label="Request More Documents">
                                      <IconButton
                                        icon={<FaFileUpload />}
                                        colorScheme="yellow"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Request Documents"
                                        onClick={() => openActionModal(driver, 'request_documents')}
                                      />
                                    </Tooltip>
                                    <Tooltip label="View Details">
                                      <IconButton
                                        icon={<FaEye />}
                                        colorScheme="blue"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="View Details"
                                        onClick={() => {
                                          // In production, this would open driver details modal
                                          toast({
                                            title: 'Driver Details',
                                            description: 'Driver details view coming soon',
                                            status: 'info',
                                            duration: 3000,
                                          });
                                        }}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                    <CardFooter pt={3}>
                      <Text fontSize="sm" color="gray.600">
                        {pendingDrivers.length} drivers awaiting approval. Review documents carefully before approval.
                      </Text>
                    </CardFooter>
                  </Card>
                  
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Approval Checklist</AlertTitle>
                      <AlertDescription>
                        Verify all required documents: National ID, Driver License, Vehicle Registration, and Photos.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </TabPanel>
              
              {/* Tab 2: Active Drivers */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Active Drivers</Heading>
                        <HStack spacing={2}>
                          <Button
                            leftIcon={<FaUserTimes />}
                            colorScheme="orange"
                            size="sm"
                            onClick={() => {
                              // Auto-suspend low rating drivers
                              const lowRatingDrivers = activeDrivers.filter(d => d.rating < driverRules.auto_suspend_below_rating);
                              if (lowRatingDrivers.length > 0) {
                                setSelectedDriverIds(lowRatingDrivers.map(d => d.id));
                                setBulkAction('suspend_low_rating');
                                onBulkModalOpen();
                              } else {
                                toast({
                                  title: 'No low rating drivers',
                                  description: 'All active drivers have good ratings',
                                  status: 'info',
                                  duration: 3000,
                                });
                              }
                            }}
                          >
                            Auto-suspend Low Ratings
                          </Button>
                        </HStack>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {driversLoading ? (
                        <Box textAlign="center" py={8}>
                          <Text>Loading active drivers...</Text>
                        </Box>
                      ) : activeDrivers.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No active drivers</AlertTitle>
                            <AlertDescription>
                              There are currently no active drivers on the platform.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Driver</Th>
                              <Th>Rating</Th>
                              <Th>Rides</Th>
                              <Th>Earnings</Th>
                              <Th>Status</Th>
                              <Th>Last Online</Th>
                              <Th textAlign="right">Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {activeDrivers.map((driver) => (
                              <Tr key={driver.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <HStack>
                                    <Avatar
                                      size="sm"
                                      name={driver.user?.full_name || driver.user?.email}
                                      src={driver.user?.avatar_url}
                                      bg="brand.500"
                                    />
                                    <Box>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {driver.user?.full_name || 'No Name'}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {driver.user?.phone}
                                      </Text>
                                    </Box>
                                  </HStack>
                                </Td>
                                <Td>
                                  <HStack>
                                    <Badge
                                      colorScheme={
                                        driver.rating >= 4.5 ? 'green' :
                                        driver.rating >= 4.0 ? 'blue' :
                                        driver.rating >= 3.5 ? 'yellow' : 'red'
                                      }
                                      fontSize="xs"
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                    >
                                      {driver.rating || 'N/A'}
                                    </Badge>
                                    {driver.rating < driverRules.auto_suspend_below_rating && (
                                      <Icon as={FaExclamationTriangle} color="red.500" boxSize="12px" />
                                    )}
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {driver.total_rides || 0}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" fontWeight="medium">
                                    GHS {driver.total_earnings || 0}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={driver.is_online ? 'green' : 'gray'}
                                    fontSize="xs"
                                  >
                                    {driver.is_online ? 'Online' : 'Offline'}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Text fontSize="xs" color="gray.600">
                                    {driver.last_online ? new Date(driver.last_online).toLocaleDateString() : 'Never'}
                                  </Text>
                                </Td>
                                <Td>
                                  <HStack spacing={2} justify="flex-end">
                                    <Tooltip label="Suspend Driver">
                                      <IconButton
                                        icon={<FaUserTimes />}
                                        colorScheme="orange"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Suspend Driver"
                                        onClick={() => openActionModal(driver, 'suspend')}
                                      />
                                    </Tooltip>
                                    <Tooltip label="Ban Driver">
                                      <IconButton
                                        icon={<FaBan />}
                                        colorScheme="red"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Ban Driver"
                                        onClick={() => openActionModal(driver, 'ban')}
                                      />
                                    </Tooltip>
                                    <Tooltip label="View Details">
                                      <IconButton
                                        icon={<FaEye />}
                                        colorScheme="blue"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="View Details"
                                        onClick={() => viewDriverDocuments(driver.id)}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 3: Suspended Drivers */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Suspended Drivers</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {driversLoading ? (
                        <Box textAlign="center" py={8}>
                          <Text>Loading suspended drivers...</Text>
                        </Box>
                      ) : suspendedDrivers.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No suspended drivers</AlertTitle>
                            <AlertDescription>
                              There are currently no suspended drivers.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Driver</Th>
                              <Th>Suspension Reason</Th>
                              <Th>Suspended On</Th>
                              <Th>Suspended By</Th>
                              <Th textAlign="right">Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {suspendedDrivers.map((driver) => (
                              <Tr key={driver.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <HStack>
                                    <Avatar
                                      size="sm"
                                      name={driver.user?.full_name || driver.user?.email}
                                      src={driver.user?.avatar_url}
                                      bg="brand.500"
                                    />
                                    <Box>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {driver.user?.full_name || 'No Name'}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {driver.user?.email}
                                      </Text>
                                    </Box>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.600">
                                    {driver.suspension_reason || 'No reason provided'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {driver.suspended_at ? new Date(driver.suspended_at).toLocaleDateString() : 'N/A'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {driver.suspended_by || 'System'}
                                  </Text>
                                </Td>
                                <Td>
                                  <HStack spacing={2} justify="flex-end">
                                    <Tooltip label="Reactivate Driver">
                                      <IconButton
                                        icon={<FaPlay />}
                                        colorScheme="green"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Reactivate Driver"
                                        onClick={() => openActionModal(driver, 'reactivate')}
                                      />
                                    </Tooltip>
                                    <Tooltip label="Ban Driver">
                                      <IconButton
                                        icon={<FaBan />}
                                        colorScheme="red"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Ban Driver"
                                        onClick={() => openActionModal(driver, 'ban')}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 4: Banned Drivers */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Banned Drivers</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {driversLoading ? (
                        <Box textAlign="center" py={8}>
                          <Text>Loading banned drivers...</Text>
                        </Box>
                      ) : bannedDrivers.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No banned drivers</AlertTitle>
                            <AlertDescription>
                              There are currently no banned drivers.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Driver</Th>
                              <Th>Ban Reason</Th>
                              <Th>Banned On</Th>
                              <Th>Banned By</Th>
                              <Th>Device Blocked</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {bannedDrivers.map((driver) => (
                              <Tr key={driver.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <HStack>
                                    <Avatar
                                      size="sm"
                                      name={driver.user?.full_name || driver.user?.email}
                                      src={driver.user?.avatar_url}
                                      bg="brand.500"
                                    />
                                    <Box>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {driver.user?.full_name || 'No Name'}
                                      </Text>
                                      <Text fontSize="xs" color="gray.600">
                                        {driver.user?.email}
                                      </Text>
                                    </Box>
                                  </HStack>
                                </Td>
                                <Td>
                                  <Text fontSize="sm" color="gray.600">
                                    {driver.ban_reason || 'No reason provided'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {driver.banned_at ? new Date(driver.banned_at).toLocaleDateString() : 'N/A'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="sm">
                                    {driver.banned_by || 'System'}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={driver.device_blocked ? 'red' : 'gray'}
                                    fontSize="xs"
                                  >
                                    {driver.device_blocked ? 'Yes' : 'No'}
                                  </Badge>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                    <CardFooter pt={3}>
                      <Text fontSize="sm" color="gray.600">
                        Banned drivers are permanently blocked from the platform. Device blocking prevents account recreation.
                      </Text>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 5: Rules & Requirements */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Driver Approval Requirements</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              National ID Required
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Driver must upload national ID for verification
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.national_id_required}
                            onChange={(e) => handleRuleChange('national_id_required', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Driver License Required
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Valid driver's license must be uploaded
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.driver_license_required}
                            onChange={(e) => handleRuleChange('driver_license_required', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Vehicle Registration Required
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Vehicle registration documents must be provided
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.vehicle_registration_required}
                            onChange={(e) => handleRuleChange('vehicle_registration_required', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Vehicle Photos Required
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Clear photos of vehicle from multiple angles
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.vehicle_photos_required}
                            onChange={(e) => handleRuleChange('vehicle_photos_required', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Phone Verification Required
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Phone number must be verified via SMS
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.phone_verification_required}
                            onChange={(e) => handleRuleChange('phone_verification_required', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Profile Photo Required
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Clear profile photo for identification
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.profile_photo_required}
                            onChange={(e) => handleRuleChange('profile_photo_required', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Criminal Record Check
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Require criminal background check (additional verification)
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.criminal_record_check}
                            onChange={(e) => handleRuleChange('criminal_record_check', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Background Check
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Comprehensive background verification
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.background_check}
                            onChange={(e) => handleRuleChange('background_check', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Driver Eligibility Criteria</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Minimum Age (years)
                          </FormLabel>
                          <NumberInput
                            value={driverRules.min_age}
                            onChange={(value) => handleRuleChange('min_age', parseInt(value) || 21)}
                            min={18}
                            max={70}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Minimum age required to become a driver
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Minimum Driving Experience (years)
                          </FormLabel>
                          <NumberInput
                            value={driverRules.min_driving_experience}
                            onChange={(value) => handleRuleChange('min_driving_experience', parseInt(value) || 2)}
                            min={0}
                            max={50}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Years of driving experience required
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Minimum Rating for Activation
                          </FormLabel>
                          <NumberInput
                            value={driverRules.min_rating_for_activation}
                            onChange={(value) => handleRuleChange('min_rating_for_activation', parseFloat(value) || 4.0)}
                            min={1}
                            max={5}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Minimum rating required to stay active
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Auto-suspend Below Rating
                          </FormLabel>
                          <NumberInput
                            value={driverRules.auto_suspend_below_rating}
                            onChange={(value) => handleRuleChange('auto_suspend_below_rating', parseFloat(value) || 3.0)}
                            min={1}
                            max={5}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Auto-suspend driver when rating falls below this value
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Auto-ban Below Rating
                          </FormLabel>
                          <NumberInput
                            value={driverRules.auto_ban_below_rating}
                            onChange={(value) => handleRuleChange('auto_ban_below_rating', parseFloat(value) || 2.0)}
                            min={1}
                            max={5}
                            step={0.1}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Auto-ban driver when rating falls below this value
                          </FormHelperText>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Complaint & Suspension Rules</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Max Complaints Before Suspension
                          </FormLabel>
                          <NumberInput
                            value={driverRules.max_complaints_before_suspension}
                            onChange={(value) => handleRuleChange('max_complaints_before_suspension', parseInt(value) || 3)}
                            min={1}
                            max={20}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Number of valid complaints before automatic suspension
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Max Complaints Before Ban
                          </FormLabel>
                          <NumberInput
                            value={driverRules.max_complaints_before_ban}
                            onChange={(value) => handleRuleChange('max_complaints_before_ban', parseInt(value) || 5)}
                            min={1}
                            max={50}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Total complaints before permanent ban
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Document Expiry Check
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Automatically check document expiry dates
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={driverRules.document_expiry_check}
                            onChange={(e) => handleRuleChange('document_expiry_check', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        {driverRules.document_expiry_check && (
                          <FormControl>
                            <FormLabel fontWeight="medium">
                              Document Expiry Warning (days)
                            </FormLabel>
                            <NumberInput
                              value={driverRules.document_expiry_days}
                              onChange={(value) => handleRuleChange('document_expiry_days', parseInt(value) || 30)}
                              min={1}
                              max={365}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                            <FormHelperText>
                              Send warning when documents expire within this many days
                            </FormHelperText>
                          </FormControl>
                        )}
                      </VStack>
                    </CardBody>
                    <CardFooter pt={3}>
                      <Button
                        colorScheme="brand"
                        size="lg"
                        width="full"
                        isLoading={saving}
                        onClick={saveDriverRules}
                        leftIcon={<FaSave />}
                      >
                        Save Driver Rules
                      </Button>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
      
      {/* Modal for driver actions */}
      <Modal isOpen={isActionModalOpen} onClose={onActionModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedAction === 'approve' && 'Approve Driver'}
            {selectedAction === 'reject' && 'Reject Driver'}
            {selectedAction === 'suspend' && 'Suspend Driver'}
            {selectedAction === 'ban' && 'Ban Driver'}
            {selectedAction === 'reactivate' && 'Reactivate Driver'}
            {selectedAction === 'request_documents' && 'Request Additional Documents'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDriver && (
              <VStack spacing={4} align="stretch">
                <Box p={3} bg="gray.50" borderRadius="md">
                  <Text fontWeight="medium">Driver: {selectedDriver.user?.full_name || selectedDriver.user?.email}</Text>
                  <Text fontSize="sm" color="gray.600">
                    Vehicle: {selectedDriver.vehicle?.make} {selectedDriver.vehicle?.model} ({selectedDriver.vehicle?.plate_number})
                  </Text>
                </Box>
                
                {(selectedAction === 'reject' || selectedAction === 'suspend' || selectedAction === 'ban') && (
                  <FormControl isRequired>
                    <FormLabel>Reason</FormLabel>
                    <Select
                      placeholder="Select reason"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                    >
                      <option value="documents_incomplete">Documents Incomplete</option>
                      <option value="documents_fake">Fake Documents</option>
                      <option value="low_rating">Low Rating</option>
                      <option value="passenger_complaints">Passenger Complaints</option>
                      <option value="fraud_suspicion">Fraud Suspicion</option>
                      <option value="safety_violation">Safety Violation</option>
                      <option value="payment_disputes">Payment Disputes</option>
                      <option value="other">Other</option>
                    </Select>
                  </FormControl>
                )}
                
                {(selectedAction === 'suspend' || selectedAction === 'ban') && (
                  <FormControl>
                    <FormLabel>Additional Notes</FormLabel>
                    <Textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Add any additional details or instructions..."
                      rows={3}
                    />
                  </FormControl>
                )}
                
                {selectedAction === 'approve' && (
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Approve Driver</AlertTitle>
                      <AlertDescription>
                        This driver will be able to go online and accept rides immediately.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
                
                {selectedAction === 'request_documents' && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Request Additional Documents</AlertTitle>
                      <AlertDescription>
                        The driver will receive a notification to upload additional documents.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onActionModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme={
                selectedAction === 'approve' || selectedAction === 'reactivate' ? 'green' :
                selectedAction === 'reject' || selectedAction === 'suspend' ? 'orange' :
                selectedAction === 'ban' ? 'red' : 'brand'
              }
              onClick={performDriverAction}
              isLoading={actionLoading}
            >
              {selectedAction === 'approve' && 'Approve Driver'}
              {selectedAction === 'reject' && 'Reject Driver'}
              {selectedAction === 'suspend' && 'Suspend Driver'}
              {selectedAction === 'ban' && 'Ban Driver'}
              {selectedAction === 'reactivate' && 'Reactivate Driver'}
              {selectedAction === 'request_documents' && 'Request Documents'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for driver documents */}
      <Modal isOpen={isDocumentsModalOpen} onClose={onDocumentsModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Driver Documents</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDocuments ? (
              <VStack spacing={4} align="stretch">
                <Wrap spacing={4}>
                  {selectedDocuments.map((doc) => (
                    <WrapItem key={doc.id}>
                      <Card borderColor="gray.200" width="200px">
                        <CardBody>
                          <VStack spacing={2}>
                            <Icon as={FaFileUpload} boxSize="32px" color="brand.500" />
                            <Text fontWeight="medium" fontSize="sm">
                              {doc.document_type.replace('_', ' ').toUpperCase()}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                            </Text>
                            {doc.expiry_date && (
                              <Badge
                                colorScheme={new Date(doc.expiry_date) > new Date() ? 'green' : 'red'}
                                fontSize="xs"
                              >
                                Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                              </Badge>
                            )}
                          </VStack>
                        </CardBody>
                        <CardFooter pt={0}>
                          <Button
                            size="xs"
                            colorScheme="blue"
                            variant="outline"
                            width="full"
                            onClick={() => window.open(doc.document_url, '_blank')}
                          >
                            View Document
                          </Button>
                        </CardFooter>
                      </Card>
                    </WrapItem>
                  ))}
                </Wrap>
              </VStack>
            ) : (
              <Text>No documents found for this driver.</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onDocumentsModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for bulk actions */}
      <Modal isOpen={isBulkModalOpen} onClose={onBulkModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Bulk Actions</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Select Action</FormLabel>
                <Select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  placeholder="Choose bulk action"
                >
                  <option value="approve_all">Approve All Selected</option>
                  <option value="suspend_low_rating">Suspend Low Rating Drivers</option>
                  <option value="request_documents">Request Documents from All</option>
                </Select>
              </FormControl>
              
              {bulkAction && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Bulk Action Warning</AlertTitle>
                    <AlertDescription>
                      This action will affect {selectedDriverIds.length} drivers. This cannot be undone.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onBulkModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={performBulkAction}
              isLoading={actionLoading}
              isDisabled={!bulkAction || selectedDriverIds.length === 0}
            >
              Perform Bulk Action
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for statistics */}
      <Modal isOpen={isStatsModalOpen} onClose={onStatsModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Driver Statistics</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <StatGroup gap={6}>
              <Stat>
                <StatLabel>Total Drivers</StatLabel>
                <StatNumber>{driverStats.total}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Active Drivers</StatLabel>
                <StatNumber>{driverStats.active}</StatNumber>
                <StatHelpText>Currently online/available</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Approval Rate</StatLabel>
                <StatNumber>{driverStats.approval_rate}%</StatNumber>
                <StatHelpText>Applications approved</StatHelpText>
              </Stat>
            </StatGroup>
            
            <Divider my={4} />
            
            <StatGroup gap={6}>
              <Stat>
                <StatLabel>Average Rating</StatLabel>
                <StatNumber>{driverStats.avg_rating}</StatNumber>
                <StatHelpText>Out of 5.0</StatHelpText>
              </Stat>
              
              <Stat>
                <StatLabel>Avg Response Time</StatLabel>
                <StatNumber>{driverStats.avg_response_time}s</StatNumber>
                <StatHelpText>To ride requests</StatHelpText>
              </Stat>
            </StatGroup>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onStatsModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for rules configuration */}
      <Modal isOpen={isRuleModalOpen} onClose={onRuleModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Configure Driver Rules</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Advanced rule configuration interface would go here.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onRuleModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default DriverRules;