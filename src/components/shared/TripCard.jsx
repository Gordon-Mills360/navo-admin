import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Flex,
  Spacer,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tooltip,
  Progress,
  Divider,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  SimpleGrid,
  Link
} from '@chakra-ui/react';
import {
  LocationIcon,
  TimeIcon,
  CalendarIcon,
  DollarIcon,
  RepeatIcon,
  ViewIcon,
  EditIcon,
  PhoneIcon,
  EmailIcon,
  ArrowForwardIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  SettingsIcon,
  StarIcon,
  CheckIcon,
  CloseIcon,
  WarningIcon,
  InfoIcon
} from '@chakra-ui/icons';
import {
  FaCar,
  FaCarSide,
  FaWalking,
  FaMapMarkerAlt,
  FaRoute,
  FaUser,
  FaUserTie,
  FaUserFriends,
  FaMoneyBillWave,
  FaCreditCard,
  FaExchangeAlt,
  FaHistory,
  FaChartLine,
  FaFileExport,
  FaFileInvoice,
  FaReceipt,
  FaCalculator,
  FaPercentage,
  FaHandHoldingUsd,
  FaHandHoldingHeart,
  FaHandHoldingWater,
  FaHandHoldingMedical,
  FaHandHolding,
  FaHandsHelping,
  FaHandshake,
  FaHandPointRight,
  FaHandPointLeft,
  FaHandPointUp,
  FaHandPointDown,
  FaHandPaper,
  FaHandRock,
  FaHandScissors,
  FaHandLizard,
  FaHandSpock,
  FaHandPointer,
  FaHandMiddleFinger,
  FaHandPeace,
  FaHandshakeAlt,
  FaHandshakeAltSlash,
  FaHands,
  FaHandsWash,
  FaHandsHelping as FaHandsHelpingIcon,
  FaHandHoldingUsd as FaHandHoldingUsdIcon,
  FaHandHoldingHeart as FaHandHoldingHeartIcon,
  FaHandHoldingWater as FaHandHoldingWaterIcon,
  FaHandHoldingMedical as FaHandHoldingMedicalIcon,
  FaHandHolding as FaHandHoldingIcon,
  FaHandsHelping as FaHandsHelpingIcon2,
  FaHandshake as FaHandshakeIcon,
  FaHandPointRight as FaHandPointRightIcon,
  FaHandPointLeft as FaHandPointLeftIcon,
  FaHandPointUp as FaHandPointUpIcon,
  FaHandPointDown as FaHandPointDownIcon,
  FaHandPaper as FaHandPaperIcon,
  FaHandRock as FaHandRockIcon,
  FaHandScissors as FaHandScissorsIcon,
  FaHandLizard as FaHandLizardIcon,
  FaHandSpock as FaHandSpockIcon,
  FaHandPointer as FaHandPointerIcon,
  FaHandMiddleFinger as FaHandMiddleFingerIcon,
  FaHandPeace as FaHandPeaceIcon,
  FaHandshakeAlt as FaHandshakeAltIcon,
  FaHandshakeAltSlash as FaHandshakeAltSlashIcon,
  FaHands as FaHandsIcon,
  FaHandsWash as FaHandsWashIcon,
  FaMap,
  FaMapPin,
  FaMapMarked,
  FaMapMarkedAlt,
  FaLocationArrow,
  FaCrosshairs,
  FaCompass,
  FaStreetView,
  FaTrafficLight,
  FaRoad,
  FaGasPump,
  FaWrench,
  FaToolbox,
  FaTools,
  FaCogs,
  FaCog,
  FaUserCog,
  FaUsersCog,
  FaRobot,
  FaMagic,
  FaKeyboard,
  FaMousePointer,
  FaHandPointer as FaHandPointerIcon2,
  FaMouse,
  FaKeyboard as FaKeyboardIcon,
  FaHeadset,
  FaPhone,
  FaPhoneAlt,
  FaVoicemail,
  FaVolumeUp,
  FaVolumeDown,
  FaVolumeMute,
  FaVolumeOff,
  FaBell,
  FaBellSlash,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaInfoCircle,
  FaQuestionCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaLock,
  FaUnlock,
  FaShieldAlt,
  FaUserShield,
  FaUserLock,
  FaUserSecret,
  FaUserNinja,
  FaUserAstronaut,
  FaUserMd,
  FaUserInjured,
  FaUserGraduate,
  FaUserTie as FaUserTieIcon,
  FaUserEdit,
  FaUserPlus,
  FaUserMinus,
  FaUserTag,
  FaUserFriends as FaUserFriendsIcon,
  FaUserCircle,
  FaUserAlt,
  FaIdCard,
  FaIdCardAlt,
  FaAddressCard,
  FaAddressBook,
  FaEnvelope,
  FaEnvelopeOpen,
  FaPaperPlane,
  FaInbox,
  FaArchive,
  FaTrashAlt,
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaFileAlt,
  FaFileArchive,
  FaFileCode,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileWord,
  FaFilePowerpoint,
  FaFileExcel,
  FaFilePdf,
  FaFileSignature,
  FaFileContract,
  FaFileMedical,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaFileUpload,
  FaFileDownload,
  FaFileImport,
  FaFileExport as FaFileExportIcon,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaSync,
  FaSyncAlt,
  FaRedoAlt,
  FaUndoAlt,
  FaRandom,
  FaRetweet,
  FaExchangeAlt as FaExchangeAltIcon,
  FaShuffle,
  FaRandom as FaRandomIcon
} from 'react-icons/fa';

// Services
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';

// Components
import StatusBadge from './StatusBadge';

// Utils
import { formatCurrency, formatDate, formatDuration } from '../../utils/formatters';

const TripCard = ({
  trip,
  compact = false,
  showActions = true,
  onClick,
  ...props
}) => {
  const [tripData, setTripData] = useState(trip);
  const [driver, setDriver] = useState(null);
  const [passenger, setPassenger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const { isOpen: isRefundOpen, onOpen: onRefundOpen, onClose: onRefundClose } = useDisclosure();
  const { isOpen: isDisputeOpen, onOpen: onDisputeOpen, onClose: onDisputeClose } = useDisclosure();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  
  const [cancelReason, setCancelReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  
  const toast = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Fetch trip data if only ID provided
  useEffect(() => {
    const fetchTripData = async () => {
      if (trip && typeof trip === 'string') {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('trips')
            .select(`
              *,
              driver:driver_id (
                id,
                first_name,
                last_name,
                phone,
                email,
                license_number,
                vehicle_model,
                vehicle_plate,
                rating
              ),
              passenger:passenger_id (
                id,
                first_name,
                last_name,
                phone,
                email,
                rating
              ),
              payment:payment_id (
                id,
                amount,
                status,
                method
              )
            `)
            .eq('id', trip)
            .single();
          
          if (error) throw error;
          
          setTripData(data);
          setDriver(data.driver);
          setPassenger(data.passenger);
          
        } catch (error) {
          console.error('Error fetching trip data:', error);
        } finally {
          setLoading(false);
        }
      } else if (trip) {
        setTripData(trip);
        setDriver(trip.driver);
        setPassenger(trip.passenger);
      }
    };
    
    fetchTripData();
  }, [trip]);

  // Get trip status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'cancelled': return 'red';
      case 'requested': return 'yellow';
      case 'driver_assigned': return 'cyan';
      case 'arriving': return 'teal';
      case 'no_show': return 'orange';
      case 'disputed': return 'purple';
      default: return 'gray';
    }
  };

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'green';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      case 'refunded': return 'purple';
      default: return 'gray';
    }
  };

  // Handle trip cancellation
  const handleCancelTrip = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a cancellation reason',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('trips')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: cancelReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripData.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'trip_cancelled',
        resource_type: 'trip',
        resource_id: tripData.id,
        details: {
          trip_id: tripData.id,
          driver_id: tripData.driver_id,
          passenger_id: tripData.passenger_id,
          cancellation_reason: cancelReason,
          cancelled_by: user.email
        },
        ip_address: 'admin_panel'
      });

      // Send notifications
      const notifications = [];
      
      if (driver) {
        notifications.push({
          user_id: driver.id,
          user_type: 'driver',
          title: 'Trip Cancelled',
          message: `Trip #${tripData.id.slice(0, 8)} has been cancelled by admin. Reason: ${cancelReason}`,
          type: 'trip',
          priority: 'high',
          metadata: { trip_id: tripData.id },
          created_by: user.id
        });
      }
      
      if (passenger) {
        notifications.push({
          user_id: passenger.id,
          user_type: 'passenger',
          title: 'Trip Cancelled',
          message: `Your trip #${tripData.id.slice(0, 8)} has been cancelled. Reason: ${cancelReason}`,
          type: 'trip',
          priority: 'high',
          metadata: { trip_id: tripData.id },
          created_by: user.id
        });
      }
      
      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: 'Success',
        description: 'Trip cancelled successfully',
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setTripData(prev => ({
        ...prev,
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancelReason
      }));

      onCancelClose();
      setCancelReason('');

    } catch (error) {
      console.error('Error cancelling trip:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel trip',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle trip refund
  const handleRefundTrip = async () => {
    if (!refundAmount || !refundReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide refund amount and reason',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const amount = parseFloat(refundAmount);
    if (isNaN(amount) || amount <= 0 || amount > (tripData.fare || 0)) {
      toast({
        title: 'Error',
        description: 'Invalid refund amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(true);
      
      // Create refund transaction
      const { data: refund, error: refundError } = await supabase
        .from('transactions')
        .insert({
          trip_id: tripData.id,
          user_id: tripData.passenger_id,
          amount: amount,
          type: 'refund',
          status: 'pending',
          description: `Refund for trip #${tripData.id.slice(0, 8)}: ${refundReason}`,
          metadata: {
            refund_reason: refundReason,
            processed_by: user.id,
            original_fare: tripData.fare,
            refund_amount: amount
          },
          created_by: user.id
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // Update trip payment status
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          refund_amount: amount,
          refund_reason: refundReason,
          refunded_at: new Date().toISOString(),
          refunded_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripData.id);

      if (tripError) throw tripError;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'trip_refunded',
        resource_type: 'trip',
        resource_id: tripData.id,
        details: {
          trip_id: tripData.id,
          passenger_id: tripData.passenger_id,
          refund_amount: amount,
          refund_reason: refundReason,
          refund_id: refund.id,
          processed_by: user.email
        },
        ip_address: 'admin_panel'
      });

      // Send notification to passenger
      if (passenger) {
        await supabase.from('notifications').insert({
          user_id: passenger.id,
          user_type: 'passenger',
          title: 'Refund Processed',
          message: `A refund of ${formatCurrency(amount)} has been processed for your trip #${tripData.id.slice(0, 8)}. Reason: ${refundReason}`,
          type: 'payment',
          priority: 'high',
          metadata: {
            trip_id: tripData.id,
            refund_id: refund.id,
            amount: amount
          },
          created_by: user.id
        });
      }

      toast({
        title: 'Success',
        description: `Refund of ${formatCurrency(amount)} processed successfully`,
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setTripData(prev => ({
        ...prev,
        refund_amount: amount,
        refund_reason: refundReason,
        refunded_at: new Date().toISOString()
      }));

      onRefundClose();
      setRefundAmount('');
      setRefundReason('');

    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process refund',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle trip dispute
  const handleDisputeTrip = async () => {
    if (!disputeDetails.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide dispute details',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('trips')
        .update({
          status: 'disputed',
          dispute_details: disputeDetails,
          disputed_at: new Date().toISOString(),
          disputed_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', tripData.id);

      if (error) throw error;

      // Create dispute record
      const { error: disputeError } = await supabase
        .from('disputes')
        .insert({
          trip_id: tripData.id,
          driver_id: tripData.driver_id,
          passenger_id: tripData.passenger_id,
          dispute_type: 'admin_initiated',
          description: disputeDetails,
          status: 'open',
          created_by: user.id
        });

      if (disputeError) throw disputeError;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'trip_disputed',
        resource_type: 'trip',
        resource_id: tripData.id,
        details: {
          trip_id: tripData.id,
          driver_id: tripData.driver_id,
          passenger_id: tripData.passenger_id,
          dispute_details: disputeDetails,
          initiated_by: user.email
        },
        ip_address: 'admin_panel'
      });

      // Send notifications
      const notifications = [];
      
      if (driver) {
        notifications.push({
          user_id: driver.id,
          user_type: 'driver',
          title: 'Trip Dispute',
          message: `Trip #${tripData.id.slice(0, 8)} has been disputed by admin. Please check the dispute details.`,
          type: 'dispute',
          priority: 'high',
          metadata: { trip_id: tripData.id, dispute_type: 'admin_initiated' },
          created_by: user.id
        });
      }
      
      if (passenger) {
        notifications.push({
          user_id: passenger.id,
          user_type: 'passenger',
          title: 'Trip Dispute',
          message: `Your trip #${tripData.id.slice(0, 8)} has been disputed. Please check the dispute details.`,
          type: 'dispute',
          priority: 'high',
          metadata: { trip_id: tripData.id, dispute_type: 'admin_initiated' },
          created_by: user.id
        });
      }
      
      if (notifications.length > 0) {
        await supabase.from('notifications').insert(notifications);
      }

      toast({
        title: 'Success',
        description: 'Dispute created successfully',
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setTripData(prev => ({
        ...prev,
        status: 'disputed',
        dispute_details: disputeDetails,
        disputed_at: new Date().toISOString()
      }));

      onDisputeClose();
      setDisputeDetails('');

    } catch (error) {
      console.error('Error creating dispute:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create dispute',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate trip duration
  const calculateDuration = () => {
    if (!tripData.started_at) return 'Not started';
    
    const start = new Date(tripData.started_at);
    const end = tripData.completed_at ? new Date(tripData.completed_at) : new Date();
    
    const duration = Math.floor((end - start) / 1000); // seconds
    return formatDuration(duration);
  };

  // Format location for display
  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    
    // If location is an object with address property
    if (typeof location === 'object' && location.address) {
      return location.address;
    }
    
    // If location is a string
    if (typeof location === 'string') {
      // Extract just the address part if it contains coordinates
      const parts = location.split(',');
      if (parts.length > 2) {
        return parts.slice(0, -2).join(',').trim();
      }
      return location;
    }
    
    return 'Unknown location';
  };

  if (loading) {
    return (
      <Card {...props}>
        <CardBody>
          <Text>Loading trip data...</Text>
        </CardBody>
      </Card>
    );
  }

  if (!tripData) {
    return (
      <Card {...props}>
        <CardBody>
          <Text color="gray.500">No trip data available</Text>
        </CardBody>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card 
        {...props}
        _hover={{ shadow: 'md', cursor: 'pointer' }}
        onClick={onClick}
      >
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" align="start">
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="sm">
                  Trip #{tripData.id?.slice(0, 8)}
                </Text>
                <HStack spacing={2}>
                  <StatusBadge status={tripData.status} size="sm" />
                  {tripData.payment?.status && (
                    <Badge
                      colorScheme={getPaymentStatusColor(tripData.payment.status)}
                      fontSize="xs"
                    >
                      {tripData.payment.status}
                    </Badge>
                  )}
                </HStack>
              </VStack>
              
              {tripData.fare && (
                <Text fontWeight="bold" color="green.500">
                  {formatCurrency(tripData.fare)}
                </Text>
              )}
            </Flex>
            
            <Divider />
            
            <VStack align="stretch" spacing={2}>
              <HStack spacing={2}>
                <FaMapMarkerAlt color="gray.500" size="12px" />
                <Text fontSize="xs" color="gray.600" noOfLines={1}>
                  {formatLocation(tripData.pickup_location)}
                </Text>
              </HStack>
              
              <HStack spacing={2}>
                <FaMapMarkerAlt color="gray.500" size="12px" />
                <Text fontSize="xs" color="gray.600" noOfLines={1}>
                  {formatLocation(tripData.dropoff_location)}
                </Text>
              </HStack>
            </VStack>
            
            <Divider />
            
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                {driver && (
                  <Tooltip label={`Driver: ${driver.first_name} ${driver.last_name}`}>
                    <Avatar
                      size="xs"
                      name={`${driver.first_name} ${driver.last_name}`}
                      src={driver.avatar_url}
                    />
                  </Tooltip>
                )}
                
                {passenger && (
                  <Tooltip label={`Passenger: ${passenger.first_name} ${passenger.last_name}`}>
                    <Avatar
                      size="xs"
                      name={`${passenger.first_name} ${passenger.last_name}`}
                      src={passenger.avatar_url}
                    />
                  </Tooltip>
                )}
              </HStack>
              
              <Text fontSize="xs" color="gray.500">
                {tripData.created_at && formatDate(tripData.created_at, 'date')}
              </Text>
            </Flex>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card {...props}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <HStack>
                <Text fontWeight="bold" fontSize="lg">
                  Trip #{tripData.id?.slice(0, 8)}
                </Text>
                <StatusBadge status={tripData.status} />
                {tripData.payment?.status && (
                  <Badge colorScheme={getPaymentStatusColor(tripData.payment.status)}>
                    {tripData.payment.status}
                  </Badge>
                )}
              </HStack>
              
              <HStack spacing={4}>
                <HStack spacing={1}>
                  <CalendarIcon color="gray.500" />
                  <Text fontSize="sm" color="gray.500">
                    {tripData.created_at && formatDate(tripData.created_at, 'datetime')}
                  </Text>
                </HStack>
                
                {tripData.distance && (
                  <HStack spacing={1}>
                    <FaRoute color="gray.500" />
                    <Text fontSize="sm" color="gray.500">
                      {tripData.distance} km
                    </Text>
                  </HStack>
                )}
                
                {tripData.duration && (
                  <HStack spacing={1}>
                    <TimeIcon color="gray.500" />
                    <Text fontSize="sm" color="gray.500">
                      {calculateDuration()}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </VStack>
            
            {tripData.fare && (
              <Box textAlign="right">
                <Text fontSize="xs" color="gray.500">Total Fare</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {formatCurrency(tripData.fare)}
                </Text>
                {tripData.payment?.method && (
                  <Text fontSize="xs" color="gray.500">
                    Paid via {tripData.payment.method}
                  </Text>
                )}
              </Box>
            )}
          </Flex>
        </CardHeader>
        
        <CardBody>
          <VStack align="stretch" spacing={4}>
            {/* Route Information */}
            <Box>
              <Text fontWeight="medium" mb={2}>Route</Text>
              <VStack align="stretch" spacing={3}>
                <HStack spacing={3}>
                  <Box
                    w={6}
                    h={6}
                    borderRadius="full"
                    bg="green.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="white" fontSize="xs">A</Text>
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="medium">Pickup</Text>
                    <Text fontSize="sm" color="gray.600">
                      {formatLocation(tripData.pickup_location)}
                    </Text>
                    {tripData.pickup_time && (
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(tripData.pickup_time, 'time')}
                      </Text>
                    )}
                  </Box>
                </HStack>
                
                <Box pl={3} ml={2.5} borderLeft="2px dashed" borderColor="gray.300" h={6} />
                
                <HStack spacing={3}>
                  <Box
                    w={6}
                    h={6}
                    borderRadius="full"
                    bg="red.500"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="white" fontSize="xs">B</Text>
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="medium">Dropoff</Text>
                    <Text fontSize="sm" color="gray.600">
                      {formatLocation(tripData.dropoff_location)}
                    </Text>
                    {tripData.dropoff_time && (
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(tripData.dropoff_time, 'time')}
                      </Text>
                    )}
                  </Box>
                </HStack>
              </VStack>
            </Box>
            
            <Divider />
            
            {/* Participants */}
            <SimpleGrid columns={2} spacing={4}>
              {driver && (
                <Box p={3} borderWidth="1px" borderRadius="md">
                  <Text fontWeight="medium" mb={2}>Driver</Text>
                  <HStack spacing={3}>
                    <Avatar
                      size="md"
                      name={`${driver.first_name} ${driver.last_name}`}
                      src={driver.avatar_url}
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">
                        {driver.first_name} {driver.last_name}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {driver.phone}
                      </Text>
                      <HStack spacing={1}>
                        <StarIcon color="yellow.500" />
                        <Text fontSize="sm">{driver.rating || 'No rating'}</Text>
                      </HStack>
                      {driver.vehicle_model && driver.vehicle_plate && (
                        <Text fontSize="xs" color="gray.500">
                          {driver.vehicle_model} • {driver.vehicle_plate}
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              )}
              
              {passenger && (
                <Box p={3} borderWidth="1px" borderRadius="md">
                  <Text fontWeight="medium" mb={2}>Passenger</Text>
                  <HStack spacing={3}>
                    <Avatar
                      size="md"
                      name={`${passenger.first_name} ${passenger.last_name}`}
                      src={passenger.avatar_url}
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">
                        {passenger.first_name} {passenger.last_name}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {passenger.phone}
                      </Text>
                      <HStack spacing={1}>
                        <StarIcon color="yellow.500" />
                        <Text fontSize="sm">{passenger.rating || 'No rating'}</Text>
                      </HStack>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </SimpleGrid>
            
            {/* Trip Details */}
            {(tripData.notes || tripData.cancellation_reason || tripData.dispute_details) && (
              <>
                <Divider />
                <Box>
                  <Text fontWeight="medium" mb={2}>Additional Information</Text>
                  {tripData.notes && (
                    <Box mb={2}>
                      <Text fontSize="sm" color="gray.500">Notes:</Text>
                      <Text fontSize="sm">{tripData.notes}</Text>
                    </Box>
                  )}
                  {tripData.cancellation_reason && (
                    <Box mb={2}>
                      <Text fontSize="sm" color="gray.500">Cancellation Reason:</Text>
                      <Text fontSize="sm" color="red.500">{tripData.cancellation_reason}</Text>
                    </Box>
                  )}
                  {tripData.dispute_details && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">Dispute Details:</Text>
                      <Text fontSize="sm" color="orange.500">{tripData.dispute_details}</Text>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </VStack>
        </CardBody>
        
        {showActions && (
          <CardFooter borderTopWidth="1px">
            <HStack spacing={2} width="100%">
              <Button
                leftIcon={<ExternalLinkIcon />}
                colorScheme="blue"
                as="a"
                href={`/operations/trips/${tripData.id}`}
                flex={1}
              >
                View Details
              </Button>
              
              {tripData.status !== 'cancelled' && tripData.status !== 'completed' && hasPermission('trips', 'cancel') && (
                <Button
                  leftIcon={<CloseIcon />}
                  colorScheme="red"
                  variant="outline"
                  onClick={onCancelOpen}
                  flex={1}
                >
                  Cancel Trip
                </Button>
              )}
              
              {tripData.status === 'completed' && hasPermission('finance', 'refunds') && (
                <Button
                  leftIcon={<FaExchangeAlt />}
                  colorScheme="purple"
                  variant="outline"
                  onClick={onRefundOpen}
                  flex={1}
                >
                  Process Refund
                </Button>
              )}
              
              {tripData.status !== 'disputed' && hasPermission('trips', 'dispute') && (
                <Button
                  leftIcon={<FaExclamationTriangle />}
                  colorScheme="orange"
                  variant="outline"
                  onClick={onDisputeOpen}
                  flex={1}
                >
                  Create Dispute
                </Button>
              )}
            </HStack>
          </CardFooter>
        )}
      </Card>
      
      {/* Cancel Trip Modal */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cancel Trip</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text>Are you sure you want to cancel this trip?</Text>
              </Alert>
              
              <FormControl isRequired>
                <FormLabel>Cancellation Reason</FormLabel>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Provide reason for cancellation..."
                  rows={3}
                />
              </FormControl>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="medium">Trip Details</Text>
                  <HStack justify="space-between">
                    <Text>Driver:</Text>
                    <Text>{driver?.first_name} {driver?.last_name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Passenger:</Text>
                    <Text>{passenger?.first_name} {passenger?.last_name}</Text>
                  </HStack>
                  {tripData.fare && (
                    <HStack justify="space-between">
                      <Text>Fare:</Text>
                      <Text>{formatCurrency(tripData.fare)}</Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCancelClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleCancelTrip}
              isLoading={actionLoading}
              loadingText="Cancelling..."
            >
              Confirm Cancellation
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Refund Trip Modal */}
      <Modal isOpen={isRefundOpen} onClose={onRefundClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Process Refund</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text>Process refund for completed trip</Text>
              </Alert>
              
              <FormControl isRequired>
                <FormLabel>Refund Amount</FormLabel>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  max={tripData.fare || 0}
                  step="0.01"
                />
                <Text fontSize="sm" color="gray.500" mt={1}>
                  Maximum refundable amount: {formatCurrency(tripData.fare || 0)}
                </Text>
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Refund Reason</FormLabel>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Provide reason for refund..."
                  rows={3}
                />
              </FormControl>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="medium">Refund Summary</Text>
                  <HStack justify="space-between">
                    <Text>Trip Fare:</Text>
                    <Text>{formatCurrency(tripData.fare || 0)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Refund Amount:</Text>
                    <Text color="green.500">{formatCurrency(parseFloat(refundAmount) || 0)}</Text>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between">
                    <Text>Passenger:</Text>
                    <Text>{passenger?.first_name} {passenger?.last_name}</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRefundClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleRefundTrip}
              isLoading={actionLoading}
              loadingText="Processing..."
            >
              Process Refund
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Dispute Trip Modal */}
      <Modal isOpen={isDisputeOpen} onClose={onDisputeClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Dispute</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text>Create a dispute for this trip</Text>
              </Alert>
              
              <FormControl isRequired>
                <FormLabel>Dispute Details</FormLabel>
                <Textarea
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  placeholder="Provide details about the dispute..."
                  rows={4}
                />
              </FormControl>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="medium">Affected Parties</Text>
                  <HStack justify="space-between">
                    <Text>Driver:</Text>
                    <Text>{driver?.first_name} {driver?.last_name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Passenger:</Text>
                    <Text>{passenger?.first_name} {passenger?.last_name}</Text>
                  </HStack>
                  {tripData.fare && (
                    <HStack justify="space-between">
                      <Text>Trip Fare:</Text>
                      <Text>{formatCurrency(tripData.fare)}</Text>
                    </HStack>
                  )}
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDisputeClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleDisputeTrip}
              isLoading={actionLoading}
              loadingText="Creating..."
            >
              Create Dispute
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TripCard;