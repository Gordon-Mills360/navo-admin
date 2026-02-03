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
  CreditCardIcon,
} from '@chakra-ui/icons';
import { FaUser, FaWallet, FaChartLine, FaMapMarkerAlt, FaShieldAlt, FaCar } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import useUserManagement from '../../../hooks/useUserManagement';
import useTripManagement from '../../../hooks/useTripManagement';
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

const PassengerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const { getPassengerDetails, updatePassenger, suspendPassenger, sendMessageToPassenger } = useUserManagement();
  const { getPassengerTrips } = useTripManagement();
  
  const toast = useToast();
  const [passenger, setPassenger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trips, setTrips] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
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

  // Fetch passenger details
  const fetchPassengerDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getPassengerDetails(id);
      
      if (fetchError) throw fetchError;
      if (!data) throw new Error('Passenger not found');
      
      setPassenger(data);
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
      
      // Fetch passenger trips
      const { data: tripsData } = await getPassengerTrips(id, { limit: 50 });
      setTrips(tripsData || []);
      
      // Fetch payment methods
      const { data: paymentsData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', id)
        .eq('user_type', 'passenger')
        .order('is_default', { ascending: false });
      setPaymentMethods(paymentsData || []);
      
    } catch (err) {
      console.error('Error fetching passenger details:', err);
      setError(err.message || 'Failed to load passenger details');
      toast({
        title: 'Error',
        description: 'Failed to load passenger details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [id, getPassengerDetails, getPassengerTrips, toast]);

  // Initial fetch
  useEffect(() => {
    if (id) {
      fetchPassengerDetails();
    }
  }, [id, fetchPassengerDetails]);

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    setActionLoading(true);
    try {
      const { error } = await suspendPassenger(id, newStatus);
      
      if (error) throw error;
      
      toast({
        title: 'Passenger status updated',
        description: `Passenger has been ${newStatus === 'suspended' ? 'suspended' : 'reactivated'}`,
        status: 'success',
        duration: 3000,
      });
      
      // Update local state
      setPassenger(prev => ({ ...prev, status: newStatus }));
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: `passenger_${newStatus}`,
        resource_type: 'passenger',
        resource_id: id,
        details: { 
          passenger_name: passenger.full_name,
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

  // Handle edit form changes
  const handleEditChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save edited passenger details
  const handleSaveEdit = async () => {
    setActionLoading(true);
    try {
      const { error } = await updatePassenger(id, editForm);
      
      if (error) throw error;
      
      toast({
        title: 'Passenger details updated',
        description: 'Passenger information has been updated successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Refresh passenger details
      fetchPassengerDetails();
      onEditClose();
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'update_passenger',
        resource_type: 'passenger',
        resource_id: id,
        details: { 
          passenger_name: passenger.full_name,
          updated_fields: Object.keys(editForm)
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to update passenger',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    const message = prompt('Enter message to send to passenger:');
    if (!message) return;
    
    setActionLoading(true);
    try {
      const { error } = await sendMessageToPassenger(id, message);
      
      if (error) throw error;
      
      toast({
        title: 'Message sent',
        description: 'Message has been sent to the passenger',
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

  // Calculate passenger statistics
  const calculateStats = () => {
    if (!passenger || !trips.length) return null;
    
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
    const totalSpent = trips
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.total_fare || 0), 0);
    const avgRating = passenger.rating || 0;
    
    return {
      completedTrips,
      cancelledTrips,
      totalSpent,
      avgRating,
      completionRate: completedTrips / trips.length * 100,
    };
  };

  const stats = calculateStats();

  if (loading && !passenger) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading passenger details...</Text>
      </Box>
    );
  }

  if (error || !passenger) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Passenger not found</AlertTitle>
          <AlertDescription>
            The passenger you're looking for doesn't exist or has been removed.
          </AlertDescription>
          <Button mt={3} onClick={() => navigate('/accounts/passengers')} leftIcon={<ChevronLeftIcon />}>
            Back to Passengers
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
            onClick={() => navigate('/accounts/passengers')}
            mb={3}
          >
            Back to Passengers
          </Button>
          <HStack spacing={4} align="center">
            <Avatar
              size="xl"
              name={passenger.full_name}
              src={passenger.profile_picture}
              bg="purple.500"
              border="4px solid"
              borderColor="white"
              boxShadow="lg"
            />
            <Box>
              <HStack align="center" spacing={3}>
                <Heading size="lg">{passenger.full_name}</Heading>
                <Badge
                  colorScheme={
                    passenger.status === 'active' ? 'green' :
                    passenger.status === 'suspended' ? 'red' :
                    passenger.status === 'pending' ? 'yellow' : 'gray'
                  }
                  fontSize="md"
                  px={3}
                  py={1}
                >
                  {passenger.status?.toUpperCase()}
                </Badge>
                {passenger.is_verified && (
                  <Badge colorScheme="blue" variant="solid">
                    VERIFIED
                  </Badge>
                )}
              </HStack>
              <Text color="gray.600" mt={1}>
                Passenger ID: {passenger.passenger_id} • Joined {new Date(passenger.created_at).toLocaleDateString()}
              </Text>
              <HStack mt={2} spacing={4}>
                <Button
                  leftIcon={<PhoneIcon />}
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`tel:${passenger.phone}`)}
                  isDisabled={!passenger.phone}
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
                  onClick={() => window.open(`mailto:${passenger.email}`)}
                >
                  Email
                </Button>
              </HStack>
            </Box>
          </HStack>
        </Box>
        
        <HStack spacing={3}>
          {hasPermission('passenger', 'edit') && (
            <Button
              leftIcon={<EditIcon />}
              colorScheme="blue"
              onClick={onEditOpen}
            >
              Edit Profile
            </Button>
          )}
          {hasPermission('passenger', 'suspend') && (
            <Button
              leftIcon={passenger.status === 'suspended' ? <UnlockIcon /> : <LockIcon />}
              colorScheme={passenger.status === 'suspended' ? 'green' : 'red'}
              onClick={() => handleStatusChange(
                passenger.status === 'suspended' ? 'active' : 'suspended'
              )}
              isLoading={actionLoading}
            >
              {passenger.status === 'suspended' ? 'Reactivate' : 'Suspend'}
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
                <StatLabel>Total Spent</StatLabel>
                <StatNumber color="purple.600">
                  ${stats.totalSpent.toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  15% from last month
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
                  Based on {passenger.total_ratings || 0} ratings
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

      {/* Trust Score */}
      <Card mb={6}>
        <CardBody>
          <HStack justify="space-between" align="center">
            <Box>
              <Heading size="md">Trust & Safety Score</Heading>
              <Text color="gray.600">Based on trip history, behavior, and verification</Text>
            </Box>
            <Box textAlign="center">
              <Text fontSize="sm" color="gray.600">Overall Score</Text>
              <Heading size="2xl" color={passenger.trust_score > 80 ? 'green.600' : passenger.trust_score > 60 ? 'yellow.600' : 'red.600'}>
                {passenger.trust_score || 75}/100
              </Heading>
            </Box>
          </HStack>
          <Progress 
            value={passenger.trust_score || 75} 
            size="lg" 
            colorScheme={passenger.trust_score > 80 ? 'green' : passenger.trust_score > 60 ? 'yellow' : 'red'}
            mt={4}
          />
          <SimpleGrid columns={4} spacing={4} mt={4}>
            <Box>
              <Text fontSize="sm" color="gray.600">Verification Level</Text>
              <Badge colorScheme={passenger.verification_level === 'full' ? 'green' : 'yellow'}>
                {passenger.verification_level || 'basic'}
              </Badge>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Report Count</Text>
              <Text fontWeight="bold">{passenger.report_count || 0}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Cancellation Rate</Text>
              <Text fontWeight="bold">{passenger.cancellation_rate || 0}%</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600">Dispute Count</Text>
              <Text fontWeight="bold">{passenger.dispute_count || 0}</Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Main Tabs */}
      <Tabs variant="enclosed" colorScheme="purple">
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Trips ({trips.length})</Tab>
          <Tab>Payment Methods ({paymentMethods.length})</Tab>
          <Tab>Preferences</Tab>
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
                      <Text fontWeight="medium">{passenger.email || 'Not provided'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Phone Number</Text>
                      <Text fontWeight="medium">{passenger.phone || 'Not provided'}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Date of Birth</Text>
                      <Text fontWeight="medium">
                        {passenger.date_of_birth ? new Date(passenger.date_of_birth).toLocaleDateString() : 'Not provided'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Gender</Text>
                      <Text fontWeight="medium" textTransform="capitalize">
                        {passenger.gender || 'Not provided'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Address</Text>
                      <Text fontWeight="medium">{passenger.address || 'Not provided'}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {passenger.city}, {passenger.state} {passenger.postal_code}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Emergency Contact</Text>
                      <Text fontWeight="medium">{passenger.emergency_contact || 'Not provided'}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {passenger.emergency_phone}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </CardBody>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <Heading size="md">Account Information</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Passenger ID</Text>
                      <Text fontWeight="medium">{passenger.passenger_id}</Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Account Status</Text>
                      <HStack>
                        <Badge
                          colorScheme={
                            passenger.status === 'active' ? 'green' :
                            passenger.status === 'suspended' ? 'red' :
                            passenger.status === 'pending' ? 'yellow' : 'gray'
                          }
                        >
                          {passenger.status}
                        </Badge>
                        {passenger.is_verified && (
                          <Badge colorScheme="blue">Verified</Badge>
                        )}
                      </HStack>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Wallet Balance</Text>
                      <Text fontWeight="bold" fontSize="xl" color="green.600">
                        ${passenger.wallet_balance?.toFixed(2) || '0.00'}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Last Trip</Text>
                      <Text fontWeight="medium">
                        {passenger.last_trip_date 
                          ? new Date(passenger.last_trip_date).toLocaleString()
                          : 'Never'
                        }
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Favorite Locations</Text>
                      <Wrap spacing={2} mt={1}>
                        {passenger.favorite_locations?.slice(0, 3).map((loc, idx) => (
                          <WrapItem key={idx}>
                            <Badge colorScheme="purple" variant="subtle">
                              {loc.substring(0, 20)}...
                            </Badge>
                          </WrapItem>
                        ))}
                        {(!passenger.favorite_locations || passenger.favorite_locations.length === 0) && (
                          <Text fontSize="sm" color="gray.500">No favorite locations</Text>
                        )}
                      </Wrap>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Preferred Language</Text>
                      <Text fontWeight="medium">
                        {passenger.preferred_language || 'English'}
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Recent Activity */}
              <Card gridColumn={{ base: 1, lg: 'span 2' }}>
                <CardHeader>
                  <Heading size="md">Recent Trips</Heading>
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
                          <Th>Driver</Th>
                          <Th>Pickup Location</Th>
                          <Th>Status</Th>
                          <Th>Fare</Th>
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
                              <HStack>
                                <Avatar size="xs" name={trip.driver_name} />
                                <Text fontSize="sm">{trip.driver_name}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Text fontSize="sm" isTruncated maxW="150px">
                                {trip.pickup_location}
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
                              <Text fontWeight="medium" color="purple.600">
                                ${trip.total_fare?.toFixed(2) || '0.00'}
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
                  header: 'Driver',
                  accessor: 'driver_name',
                },
                {
                  header: 'Vehicle',
                  accessor: 'vehicle',
                  cell: (row) => row.vehicle?.plate_number || 'N/A',
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
                  header: 'Fare',
                  accessor: 'total_fare',
                  cell: (row) => (
                    <Text fontWeight="medium" color="purple.600">
                      ${row.total_fare?.toFixed(2) || '0.00'}
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

          {/* Payment Methods Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {paymentMethods.length === 0 ? (
                <Box gridColumn="span 3" textAlign="center" py={10}>
                  <Text color="gray.500">No payment methods added</Text>
                </Box>
              ) : (
                paymentMethods.map(payment => (
                  <Card key={payment.id}>
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <HStack justify="space-between">
                          <Box>
                            <Text fontWeight="medium" textTransform="capitalize">
                              {payment.payment_type}
                            </Text>
                            {payment.is_default && (
                              <Badge colorScheme="green" size="sm">Default</Badge>
                            )}
                          </Box>
                          <Badge
                            colorScheme={payment.status === 'active' ? 'green' : 'red'}
                          >
                            {payment.status}
                          </Badge>
                        </HStack>
                        
                        {payment.payment_type === 'card' && (
                          <>
                            <Box>
                              <Text fontSize="sm" color="gray.600">Card Number</Text>
                              <Text fontFamily="mono" fontSize="sm">
                                **** **** **** {payment.last_four}
                              </Text>
                            </Box>
                            
                            <Box>
                              <Text fontSize="sm" color="gray.600">Expiry Date</Text>
                              <Text>
                                {payment.expiry_month}/{payment.expiry_year}
                              </Text>
                            </Box>
                            
                            <Box>
                              <Text fontSize="sm" color="gray.600">Card Holder</Text>
                              <Text>{payment.card_holder_name}</Text>
                            </Box>
                          </>
                        )}
                        
                        {payment.payment_type === 'wallet' && (
                          <Box>
                            <Text fontSize="sm" color="gray.600">Wallet Balance</Text>
                            <Text fontSize="lg" fontWeight="bold" color="green.600">
                              ${payment.balance?.toFixed(2) || '0.00'}
                            </Text>
                          </Box>
                        )}
                        
                        <HStack spacing={2} mt={2}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: 'Feature coming soon',
                                description: 'Payment method management will be available in the next update',
                                status: 'info',
                                duration: 3000,
                              });
                            }}
                            flex={1}
                          >
                            Manage
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                ))
              )}
            </SimpleGrid>
          </TabPanel>

          {/* Preferences Tab */}
          <TabPanel>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Ride Preferences</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Preferred Vehicle Type</Text>
                      <Text fontWeight="medium">
                        {passenger.preferred_vehicle_type || 'Any'}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Music Preference</Text>
                      <Text fontWeight="medium">
                        {passenger.music_preference || 'No preference'}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Conversation Preference</Text>
                      <Text fontWeight="medium">
                        {passenger.conversation_preference || 'As per driver'}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Temperature Preference</Text>
                      <Text fontWeight="medium">
                        {passenger.temperature_preference || 'Moderate'}
                      </Text>
                    </Box>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.600">Accessibility Needs</Text>
                      <Text fontWeight="medium">
                        {passenger.accessibility_needs || 'None'}
                      </Text>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <Heading size="md">Notification Preferences</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Trip Updates</Text>
                      <Badge colorScheme={passenger.notify_trip_updates ? 'green' : 'gray'}>
                        {passenger.notify_trip_updates ? 'ON' : 'OFF'}
                      </Badge>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm">Promotions</Text>
                      <Badge colorScheme={passenger.notify_promotions ? 'green' : 'gray'}>
                        {passenger.notify_promotions ? 'ON' : 'OFF'}
                      </Badge>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm">Safety Alerts</Text>
                      <Badge colorScheme={passenger.notify_safety_alerts ? 'green' : 'gray'}>
                        {passenger.notify_safety_alerts ? 'ON' : 'OFF'}
                      </Badge>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm">Payment Receipts</Text>
                      <Badge colorScheme={passenger.notify_payment_receipts ? 'green' : 'gray'}>
                        {passenger.notify_payment_receipts ? 'ON' : 'OFF'}
                      </Badge>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm">Newsletter</Text>
                      <Badge colorScheme={passenger.notify_newsletter ? 'green' : 'gray'}>
                        {passenger.notify_newsletter ? 'ON' : 'OFF'}
                      </Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Passenger Information</ModalHeader>
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

export default PassengerDetail;