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
  Avatar,
  Divider,
  Input,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tooltip,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  PhoneIcon,
  ChatIcon,
  EmailIcon,
  EditIcon,
  CheckCircleIcon,
  WarningIcon,
  TimeIcon,
  StarIcon,
  ChevronLeftIcon,
  DownloadIcon,
  AttachmentIcon,
  CalendarIcon,
  LockIcon,
  UnlockIcon,
} from '@chakra-ui/icons';
import { FaCar, FaIdCard, FaWallet, FaChartLine, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import useUserManagement from '../../../hooks/useUserManagement';
import useTripManagement from '../../../hooks/useTripManagement';
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

const DriverDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const { getDriverDetails, updateDriver, suspendDriver, sendMessageToDriver } = useUserManagement();
  const { getDriverTrips } = useTripManagement();
  
  const toast = useToast();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trips, setTrips] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [walletHistory, setWalletHistory] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure();
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    action: '',
    type: 'confirm',
  });

  // Fetch driver details
  const fetchDriverDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getDriverDetails(id);
      
      if (fetchError) throw fetchError;
      if (!data) throw new Error('Driver not found');
      
      setDriver(data);
      setEditForm({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        emergency_contact: data.emergency_contact,
        emergency_phone: data.emergency_phone,
      });
      
      // Fetch driver trips
      const { data: tripsData } = await getDriverTrips(id, { limit: 50 });
      setTrips(tripsData || []);
      
      // Fetch driver documents
      const { data: docsData } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', id)
        .order('created_at', { ascending: false });
      setDocuments(docsData || []);
      
      // Fetch wallet history
      const { data: walletData } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('user_id', id)
        .eq('user_type', 'driver')
        .order('created_at', { ascending: false })
        .limit(20);
      setWalletHistory(walletData || []);
      
    } catch (err) {
      console.error('Error fetching driver details:', err);
      setError(err.message || 'Failed to load driver details');
      toast({
        title: 'Error',
        description: 'Failed to load driver details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, getDriverDetails, getDriverTrips, toast]);

  // Initial fetch
  useEffect(() => {
    if (id) {
      fetchDriverDetails();
    }
  }, [id, fetchDriverDetails]);

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      const { error } = await suspendDriver(id, newStatus);
      
      if (error) throw error;
      
      toast({
        title: 'Driver status updated',
        description: `Driver has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`,
        status: 'success',
        duration: 3000,
      });
      
      // Update local state
      setDriver(prev => ({ ...prev, status: newStatus }));
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: `driver_${newStatus}`,
        resource_type: 'driver',
        resource_id: id,
        details: { 
          driver_name: driver.full_name,
          new_status: newStatus 
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to update status',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle verification status change
  const handleVerificationChange = async (documentId, newStatus) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('driver_documents')
        .update({ 
          verification_status: newStatus,
          verified_by: user.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', documentId);
      
      if (error) throw error;
      
      toast({
        title: 'Document status updated',
        description: `Document has been ${newStatus}`,
        status: 'success',
        duration: 3000,
      });
      
      // Refresh documents
      const { data: docsData } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', id)
        .order('created_at', { ascending: false });
      setDocuments(docsData || []);
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'verify_document',
        resource_type: 'driver_document',
        resource_id: documentId,
        details: { 
          driver_id: id,
          driver_name: driver.full_name,
          new_status: newStatus 
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to update document',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit form changes
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save edited driver details
  const handleSaveEdit = async () => {
    setActionLoading(true);
    try {
      const { error } = await updateDriver(id, editForm);
      
      if (error) throw error;
      
      toast({
        title: 'Driver details updated',
        description: 'Driver information has been updated successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Refresh driver details
      fetchDriverDetails();
      onEditClose();
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'update_driver',
        resource_type: 'driver',
        resource_id: id,
        details: { 
          driver_name: driver.full_name,
          updated_fields: Object.keys(editForm)
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to update driver',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle wallet balance adjustment
  const handleAdjustBalance = () => {
    // Implementation for wallet balance adjustment
    toast({
      title: 'Feature coming soon',
      description: 'Wallet balance adjustment feature will be available in the next update',
      status: 'info',
      duration: 3000,
    });
  };

  // Handle send message
  const handleSendMessage = async () => {
    const message = prompt('Enter message to send to driver:');
    if (!message) return;
    
    setActionLoading(true);
    try {
      const { error } = await sendMessageToDriver(id, message);
      
      if (error) throw error;
      
      toast({
        title: 'Message sent',
        description: 'Message has been sent to the driver',
        status: 'success',
        duration: 3000,
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

  // Calculate driver statistics
  const calculateStats = () => {
    if (!driver || !trips.length) return null;
    
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
    const totalEarnings = trips
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.driver_earnings || 0), 0);
    const avgRating = driver.rating || 0;
    
    return {
      completedTrips,
      cancelledTrips,
      totalEarnings,
      avgRating,
      completionRate: completedTrips / trips.length * 100,
    };
  };

  const stats = calculateStats();

  if (loading && !driver) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading driver details...</Text>
      </Box>
    );
  }

  if (error || !driver) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Driver not found</AlertTitle>
          <AlertDescription>
            The driver you're looking for doesn't exist or has been removed.
          </AlertDescription>
          <Button mt={3} onClick={() => navigate('/accounts/drivers')} leftIcon={<ChevronLeftIcon />}>
            Back to Drivers
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="start" mb={6}>
        <Box>
          <Button
            leftIcon={<ChevronLeftIcon />}
            variant="ghost"
            onClick={() => navigate('/accounts/drivers')}
            mb={3}
          >
            Back to Drivers
          </Button>
          <HStack spacing={4} align="center">
            <Avatar
              size="xl"
              name={driver.full_name}
              src={driver.profile_picture}
              bg="blue.500"
              border="4px solid"
              borderColor="white"
              boxShadow="lg"
            />
            <Box>
              <HStack align="center" spacing={3}>
                <Heading size="lg">{driver.full_name}</Heading>
                <Badge
                  colorScheme={
                    driver.status === 'active' ? 'green' :
                    driver.status === 'suspended' ? 'red' :
                    driver.status === 'pending' ? 'yellow' : 'gray'
                  }
                  fontSize="md"
                  px={3}
                  py={1}
                >
                  {driver.status?.toUpperCase()}
                </Badge>
                {driver.is_online && (
                  <Badge colorScheme="green" variant="solid">
                    ONLINE
                  </Badge>
                )}
              </HStack>
              <Text color="gray.600" mt={1}>
                Driver ID: {driver.driver_id} • Joined {new Date(driver.created_at).toLocaleDateString()}
              </Text>
              <HStack mt={2} spacing={4}>
                <Button
                  leftIcon={<PhoneIcon />}
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`tel:${driver.phone}`)}
                  isDisabled={!driver.phone}
                >
                  Call
                </Button>
                <Button
                  leftIcon={<ChatIcon />}
                  size="sm"
                  variant="outline"
                  onClick={handleSendMessage}
                >
                  Message
                </Button>
                <Button
                  leftIcon={<EmailIcon />}
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`mailto:${driver.email}`)}
                >
                  Email
                </Button>
              </HStack>
            </Box>
          </HStack>
        </Box>
        
        <HStack spacing={3}>
          {hasPermission('driver', 'edit') && (
            <Button
              leftIcon={<EditIcon />}
              colorScheme="blue"
              onClick={onEditOpen}
            >
              Edit Profile
            </Button>
          )}
          {hasPermission('driver', 'suspend') && (
            <Button
              leftIcon={driver.status === 'suspended' ? <UnlockIcon /> : <LockIcon />}
              colorScheme={driver.status === 'suspended' ? 'green' : 'red'}
              onClick={() => handleStatusChange(
                driver.status === 'suspended' ? 'active' : 'suspended'
              )}
              isLoading={actionLoading}
            >
              {driver.status === 'suspended' ? 'Reactivate' : 'Suspend'}
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Stats Cards */}
      {stats && (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Trips</StatLabel>
                <StatNumber>{trips.length}</StatNumber>
                <StatHelpText>
                  {stats.completedTrips} completed • {stats.cancelledTrips} cancelled
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Earnings</StatLabel>
                <StatNumber color="green.600">
                  ${stats.totalEarnings.toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  12% from last month
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Average Rating</StatLabel>
                <HStack>
                  <StarIcon color="yellow.500" />
                  <StatNumber>{stats.avgRating.toFixed(1)}</StatNumber>
                </HStack>
                <StatHelpText>
                  Based on {driver.total_ratings || 0} ratings
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Completion Rate</StatLabel>
                <StatNumber>{stats.completionRate.toFixed(1)}%</StatNumber>
                <Progress value={stats.completionRate} size="xs" colorScheme="green" mt={2} />
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Main Tabs */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Trips ({trips.length})</Tab>
          <Tab>Documents ({documents.length})</Tab>
          <Tab>Wallet</Tab>
          <Tab>Vehicle</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <Heading size="md">Personal Information</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Email Address</Text>
                      <Text fontWeight="medium">{driver.email || 'Not provided'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Phone Number</Text>
                      <Text fontWeight="medium">{driver.phone || 'Not provided'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Date of Birth</Text>
                      <Text fontWeight="medium">
                        {driver.date_of_birth ? new Date(driver.date_of_birth).toLocaleDateString() : 'Not provided'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Gender</Text>
                      <Text fontWeight="medium" textTransform="capitalize">
                        {driver.gender || 'Not provided'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Address</Text>
                      <Text fontWeight="medium">{driver.address || 'Not provided'}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {driver.city}, {driver.state} {driver.postal_code}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Emergency Contact</Text>
                      <Text fontWeight="medium">{driver.emergency_contact || 'Not provided'}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {driver.emergency_phone}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Driver Information */}
              <Card>
                <CardHeader>
                  <Heading size="md">Driver Information</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Driver ID</Text>
                      <Text fontWeight="medium">{driver.driver_id}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Account Status</Text>
                      <HStack>
                        <Badge
                          colorScheme={
                            driver.status === 'active' ? 'green' :
                            driver.status === 'suspended' ? 'red' :
                            driver.status === 'pending' ? 'yellow' : 'gray'
                          }
                        >
                          {driver.status}
                        </Badge>
                        {driver.is_online && (
                          <Badge colorScheme="green">Online</Badge>
                        )}
                        {driver.is_verified && (
                          <Badge colorScheme="blue">Verified</Badge>
                        )}
                      </HStack>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Current Status</Text>
                      <Text fontWeight="medium" textTransform="capitalize">
                        {driver.current_status || 'offline'}
                        {driver.current_trip_id && ' (On Trip)'}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Last Active</Text>
                      <Text fontWeight="medium">
                        {driver.last_active_at 
                          ? new Date(driver.last_active_at).toLocaleString()
                          : 'Never'
                        }
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Acceptance Rate</Text>
                      <HStack>
                        <Progress 
                          value={driver.acceptance_rate || 0} 
                          width="100%" 
                          colorScheme="green"
                          size="sm"
                        />
                        <Text fontWeight="medium">{driver.acceptance_rate || 0}%</Text>
                      </HStack>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Cancellation Rate</Text>
                      <HStack>
                        <Progress 
                          value={driver.cancellation_rate || 0} 
                          width="100%" 
                          colorScheme="red"
                          size="sm"
                        />
                        <Text fontWeight="medium">{driver.cancellation_rate || 0}%</Text>
                      </HStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Recent Activity */}
              <Card gridColumn={{ base: 1, lg: 'span 2' }}>
                <CardHeader>
                  <Heading size="md">Recent Activity</Heading>
                </CardHeader>
                <CardBody>
                  {trips.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No recent trips
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Trip ID</Th>
                          <Th>Date & Time</Th>
                          <Th>Pickup Location</Th>
                          <Th>Dropoff Location</Th>
                          <Th>Status</Th>
                          <Th>Earnings</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {trips.slice(0, 5).map(trip => (
                          <Tr key={trip.id} _hover={{ bg: 'gray.50' }}>
                            <Td>
                              <Text fontWeight="medium">#{trip.trip_code}</Text>
                            </Td>
                            <Td>
                              {new Date(trip.created_at).toLocaleDateString()}
                              <Text fontSize="xs" color="gray.500">
                                {new Date(trip.created_at).toLocaleTimeString()}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" isTruncated maxW="150px">
                                {trip.pickup_location}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" isTruncated maxW="150px">
                                {trip.dropoff_location}
                              </Text>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  trip.status === 'completed' ? 'green' :
                                  trip.status === 'cancelled' ? 'red' :
                                  trip.status === 'in_progress' ? 'blue' : 'gray'
                                }
                              >
                                {trip.status}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontWeight="medium" color="green.600">
                                ${trip.driver_earnings?.toFixed(2) || '0.00'}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                  {trips.length > 5 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      width="100%"
                      mt={4}
                      onClick={() => {
                        // Navigate to trips tab
                        document.querySelector('button[role="tab"]:nth-child(2)').click();
                      }}
                    >
                      View All Trips ({trips.length})
                    </Button>
                  )}
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* Trips Tab */}
          <TabPanel px={0}>
            <DataTable
              columns={[
                {
                  header: 'Trip ID',
                  accessor: 'trip_code',
                  cell: (row) => `#${row.trip_code}`,
                },
                {
                  header: 'Date & Time',
                  accessor: 'created_at',
                  cell: (row) => new Date(row.created_at).toLocaleString(),
                },
                {
                  header: 'Passenger',
                  accessor: 'passenger_name',
                },
                {
                  header: 'Pickup',
                  accessor: 'pickup_location',
                  cell: (row) => (
                    <Text isTruncated maxW="200px">
                      {row.pickup_location}
                    </Text>
                  ),
                },
                {
                  header: 'Dropoff',
                  accessor: 'dropoff_location',
                  cell: (row) => (
                    <Text isTruncated maxW="200px">
                      {row.dropoff_location}
                    </Text>
                  ),
                },
                {
                  header: 'Status',
                  accessor: 'status',
                  cell: (row) => (
                    <Badge
                      colorScheme={
                        row.status === 'completed' ? 'green' :
                        row.status === 'cancelled' ? 'red' :
                        row.status === 'in_progress' ? 'blue' : 'gray'
                      }
                    >
                      {row.status}
                    </Badge>
                  ),
                },
                {
                  header: 'Earnings',
                  accessor: 'driver_earnings',
                  cell: (row) => (
                    <Text fontWeight="medium" color="green.600">
                      ${row.driver_earnings?.toFixed(2) || '0.00'}
                    </Text>
                  ),
                },
              ]}
              data={trips}
              loading={loading}
              searchable
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>

          {/* Documents Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {documents.length === 0 ? (
                <Box gridColumn="span 3" textAlign="center" py={10}>
                  <Text color="gray.500">No documents uploaded</Text>
                </Box>
              ) : (
                documents.map(doc => (
                  <Card key={doc.id}>
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Box>
                            <Text fontWeight="medium" textTransform="capitalize">
                              {doc.document_type?.replace('_', ' ')}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              Uploaded {new Date(doc.created_at).toLocaleDateString()}
                            </Text>
                          </Box>
                          <Badge
                            colorScheme={
                              doc.verification_status === 'verified' ? 'green' :
                              doc.verification_status === 'rejected' ? 'red' :
                              doc.verification_status === 'pending' ? 'yellow' : 'gray'
                            }
                          >
                            {doc.verification_status}
                          </Badge>
                        </HStack>
                        
                        <Box>
                          <Text fontSize="sm" color="gray.600">Document Number</Text>
                          <Text fontFamily="mono" fontSize="sm">
                            {doc.document_number || 'N/A'}
                          </Text>
                        </Box>
                        
                        <Box>
                          <Text fontSize="sm" color="gray.600">Expiry Date</Text>
                          <Text>
                            {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'No expiry'}
                          </Text>
                        </Box>
                        
                        {doc.notes && (
                          <Box>
                            <Text fontSize="sm" color="gray.600">Notes</Text>
                            <Text fontSize="sm" fontStyle="italic">
                              {doc.notes}
                            </Text>
                          </Box>
                        )}
                        
                        <HStack spacing={2} mt={2}>
                          <Button
                            size="sm"
                            leftIcon={<AttachmentIcon />}
                            onClick={() => window.open(doc.document_url, '_blank')}
                            flex={1}
                          >
                            View
                          </Button>
                          {hasPermission('driver', 'verify_document') && (
                            <Menu>
                              <MenuButton
                                as={Button}
                                size="sm"
                                colorScheme={
                                  doc.verification_status === 'verified' ? 'green' :
                                  doc.verification_status === 'rejected' ? 'red' : 'gray'
                                }
                              >
                                Verify
                              </MenuButton>
                              <MenuList>
                                <MenuItem
                                  icon={<CheckCircleIcon color="green.500" />}
                                  onClick={() => handleVerificationChange(doc.id, 'verified')}
                                >
                                  Mark as Verified
                                </MenuItem>
                                <MenuItem
                                  icon={<WarningIcon color="red.500" />}
                                  onClick={() => handleVerificationChange(doc.id, 'rejected')}
                                >
                                  Mark as Rejected
                                </MenuItem>
                                <MenuItem
                                  icon={<TimeIcon color="yellow.500" />}
                                  onClick={() => handleVerificationChange(doc.id, 'pending')}
                                >
                                  Mark as Pending
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))
              )}
            </SimpleGrid>
          </TabPanel>

          {/* Wallet Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Wallet Summary */}
              <Card>
                <CardHeader>
                  <Heading size="md">Wallet Summary</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Box textAlign="center" py={4}>
                      <Text fontSize="sm" color="gray.600">Current Balance</Text>
                      <Heading size="2xl" color="green.600">
                        ${driver.wallet_balance?.toFixed(2) || '0.00'}
                      </Heading>
                    </Box>
                    
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Total Earnings</Text>
                        <Text fontSize="lg" fontWeight="bold">
                          ${stats?.totalEarnings.toFixed(2) || '0.00'}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Pending Payout</Text>
                        <Text fontSize="lg" fontWeight="bold" color="orange.600">
                          ${driver.pending_payout?.toFixed(2) || '0.00'}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Total Payouts</Text>
                        <Text fontSize="lg" fontWeight="bold" color="blue.600">
                          ${driver.total_payouts?.toFixed(2) || '0.00'}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600">Last Payout</Text>
                        <Text fontSize="lg" fontWeight="bold">
                          {driver.last_payout_date 
                            ? new Date(driver.last_payout_date).toLocaleDateString()
                            : 'Never'
                          }
                        </Text>
                      </Box>
                    </SimpleGrid>
                    
                    <Divider />
                    
                    <HStack spacing={3}>
                      <Button
                        colorScheme="blue"
                        leftIcon={<FaWallet />}
                        onClick={handleAdjustBalance}
                        isDisabled={!hasPermission('driver', 'adjust_wallet')}
                      >
                        Adjust Balance
                      </Button>
                      <Button
                        colorScheme="green"
                        leftIcon={<DownloadIcon />}
                        onClick={() => {
                          toast({
                            title: 'Feature coming soon',
                            description: 'Payout processing feature will be available in the next update',
                            status: 'info',
                            duration: 3000,
                          });
                        }}
                        isDisabled={!hasPermission('driver', 'process_payout')}
                      >
                        Process Payout
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <Heading size="md">Recent Transactions</Heading>
                </CardHeader>
                <CardBody>
                  {walletHistory.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={4}>
                      No transaction history
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Date</Th>
                          <Th>Description</Th>
                          <Th isNumeric>Amount</Th>
                          <Th>Type</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {walletHistory.map(transaction => (
                          <Tr key={transaction.id} _hover={{ bg: 'gray.50' }}>
                            <Td>
                              <Text fontSize="xs">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">{transaction.description}</Text>
                              {transaction.reference && (
                                <Text fontSize="xs" color="gray.500">
                                  Ref: {transaction.reference}
                                </Text>
                              )}
                            </Td>
                            <Td isNumeric>
                              <Text
                                fontWeight="medium"
                                color={transaction.type === 'credit' ? 'green.600' : 'red.600'}
                              >
                                {transaction.type === 'credit' ? '+' : '-'}$
                                {Math.abs(transaction.amount).toFixed(2)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  transaction.type === 'credit' ? 'green' :
                                  transaction.type === 'debit' ? 'red' : 'gray'
                                }
                                variant="subtle"
                              >
                                {transaction.type}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>

          {/* Vehicle Tab */}
          <TabPanel>
            {driver.vehicle ? (
              <Card>
                <CardHeader>
                  <Heading size="md">Vehicle Information</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Make & Model</Text>
                      <Text fontSize="xl" fontWeight="bold">
                        {driver.vehicle.make} {driver.vehicle.model}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {driver.vehicle.year}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">License Plate</Text>
                      <Text fontSize="xl" fontWeight="bold" fontFamily="mono">
                        {driver.vehicle.plate_number}
                      </Text>
                      <Badge colorScheme="blue" mt={1}>
                        {driver.vehicle.color}
                      </Badge>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Vehicle Type</Text>
                      <Text fontSize="lg" fontWeight="medium" textTransform="capitalize">
                        {driver.vehicle.vehicle_type}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Registration Number</Text>
                      <Text fontSize="lg" fontFamily="mono">
                        {driver.vehicle.registration_number}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Registration Expiry</Text>
                      <Text fontSize="lg">
                        {driver.vehicle.registration_expiry 
                          ? new Date(driver.vehicle.registration_expiry).toLocaleDateString()
                          : 'Not set'
                        }
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Insurance Provider</Text>
                      <Text fontSize="lg">{driver.vehicle.insurance_provider}</Text>
                      <Text fontSize="sm" color="gray.500">
                        Expires: {driver.vehicle.insurance_expiry 
                          ? new Date(driver.vehicle.insurance_expiry).toLocaleDateString()
                          : 'N/A'
                        }
                      </Text>
                    </Box>
                  </SimpleGrid>
                  
                  <Divider my={6} />
                  
                  <Heading size="md" mb={4}>Vehicle Documents</Heading>
                  <Wrap spacing={4}>
                    {driver.vehicle.registration_certificate && (
                      <WrapItem>
                        <Button
                          leftIcon={<AttachmentIcon />}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(driver.vehicle.registration_certificate, '_blank')}
                        >
                          Registration Certificate
                        </Button>
                      </WrapItem>
                    )}
                    {driver.vehicle.insurance_certificate && (
                      <WrapItem>
                        <Button
                          leftIcon={<AttachmentIcon />}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(driver.vehicle.insurance_certificate, '_blank')}
                        >
                          Insurance Certificate
                        </Button>
                      </WrapItem>
                    )}
                    {driver.vehicle.fitness_certificate && (
                      <WrapItem>
                        <Button
                          leftIcon={<AttachmentIcon />}
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(driver.vehicle.fitness_certificate, '_blank')}
                        >
                          Fitness Certificate
                        </Button>
                      </WrapItem>
                    )}
                  </Wrap>
                </CardBody>
              </Card>
            ) : (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>No vehicle information</AlertTitle>
                  <AlertDescription>
                    This driver has not registered a vehicle yet.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Driver Information</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={editForm.full_name || ''}
                  onChange={(e) => handleEditChange('full_name', e.target.value)}
                />
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => handleEditChange('email', e.target.value)}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => handleEditChange('phone', e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea
                  value={editForm.address || ''}
                  onChange={(e) => handleEditChange('address', e.target.value)}
                  rows={2}
                />
              </FormControl>
              
              <SimpleGrid columns={3} spacing={4}>
                <FormControl>
                  <FormLabel>City</FormLabel>
                  <Input
                    value={editForm.city || ''}
                    onChange={(e) => handleEditChange('city', e.target.value)}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>State</FormLabel>
                  <Input
                    value={editForm.state || ''}
                    onChange={(e) => handleEditChange('state', e.target.value)}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Postal Code</FormLabel>
                  <Input
                    value={editForm.postal_code || ''}
                    onChange={(e) => handleEditChange('postal_code', e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>
              
              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Emergency Contact</FormLabel>
                  <Input
                    value={editForm.emergency_contact || ''}
                    onChange={(e) => handleEditChange('emergency_contact', e.target.value)}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Emergency Phone</FormLabel>
                  <Input
                    type="tel"
                    value={editForm.emergency_phone || ''}
                    onChange={(e) => handleEditChange('emergency_phone', e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveEdit}
              isLoading={actionLoading}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DriverDetail;