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
  Link,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import {
  PhoneIcon,
  EmailIcon,
  StarIcon,
  TimeIcon,
  CalendarIcon,
  ViewIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  WarningIcon,
  InfoIcon,
  ArrowForwardIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  SettingsIcon,
  DownloadIcon,
  CopyIcon,
  LockIcon,
  UnlockIcon
} from '@chakra-ui/icons';
import {
  FaCar,
  FaCarSide,
  FaGasPump,
  FaWrench,
  FaTools,
  FaIdCard,
  FaShieldAlt,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaUserLock,
  FaUserCog,
  FaChartLine,
  FaHistory,
  FaFileExport,
  FaFileInvoice,
  FaReceipt,
  FaCalculator,
  FaPercentage,
  FaHandHoldingUsd,
  FaMoneyBillWave,
  FaCreditCard,
  FaExchangeAlt,
  FaBell,
  FaMapMarkerAlt,
  FaRoute,
  FaRoad,
  FaTrafficLight,
  FaTachometerAlt,
  FaCogs,
  FaCog,
  FaUserCog as FaUserCogIcon,
  FaUsersCog,
  FaRobot,
  FaMagic,
  FaKeyboard,
  FaMousePointer,
  FaHandPointer,
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
  FaBell as FaBellIcon,
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
  FaShieldAlt as FaShieldAltIcon,
  FaUserShield,
  FaUserLock as FaUserLockIcon,
  FaUserSecret,
  FaUserNinja,
  FaUserAstronaut,
  FaUserMd,
  FaUserInjured,
  FaUserGraduate,
  FaUserTie,
  FaUserEdit,
  FaUserPlus,
  FaUserMinus,
  FaUserTag,
  FaUserFriends,
  FaUserCircle,
  FaUserAlt,
  FaIdCard as FaIdCardIcon,
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
  FaFileInvoice as FaFileInvoiceIcon,
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
import { formatDate, formatPhone, formatCurrency } from '../../utils/formatters';

const DriverCard = ({
  driver,
  compact = false,
  showStats = true,
  onAction,
  ...props
}) => {
  const [driverData, setDriverData] = useState(driver);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { isOpen: isCallOpen, onOpen: onCallOpen, onClose: onCallClose } = useDisclosure();
  const { isOpen: isMessageOpen, onOpen: onMessageOpen, onClose: onMessageClose } = useDisclosure();
  const { isOpen: isSuspendOpen, onOpen: onSuspendOpen, onClose: onSuspendClose } = useDisclosure();
  const { isOpen: isApproveOpen, onOpen: onApproveOpen, onClose: onApproveClose } = useDisclosure();
  const { isOpen: isVerifyOpen, onOpen: onVerifyOpen, onClose: onVerifyClose } = useDisclosure();
  
  const [suspendReason, setSuspendReason] = useState('');
  const [messageText, setMessageText] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  
  const toast = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Fetch driver data if only ID provided
  useEffect(() => {
    const fetchDriverData = async () => {
      if (driver && typeof driver === 'string') {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('drivers')
            .select(`
              *,
              vehicles(*),
              documents(*),
              trips(
                id,
                status,
                fare,
                created_at
              )
            `)
            .eq('id', driver)
            .single();
          
          if (error) throw error;
          
          setDriverData(data);
          
          // Calculate stats
          const trips = data.trips || [];
          const completedTrips = trips.filter(t => t.status === 'completed').length;
          const totalEarnings = trips
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.fare || 0), 0);
          const averageRating = data.rating || 0;
          
          setStats({
            totalTrips: trips.length,
            completedTrips,
            totalEarnings,
            averageRating,
            acceptanceRate: trips.length > 0 ? Math.round((completedTrips / trips.length) * 100) : 0
          });
          
        } catch (error) {
          console.error('Error fetching driver data:', error);
        } finally {
          setLoading(false);
        }
      } else if (driver) {
        setDriverData(driver);
        
        // Calculate stats if trips data available
        if (driver.trips) {
          const trips = driver.trips;
          const completedTrips = trips.filter(t => t.status === 'completed').length;
          const totalEarnings = trips
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.fare || 0), 0);
          const averageRating = driver.rating || 0;
          
          setStats({
            totalTrips: trips.length,
            completedTrips,
            totalEarnings,
            averageRating,
            acceptanceRate: trips.length > 0 ? Math.round((completedTrips / trips.length) * 100) : 0
          });
        }
      }
    };
    
    fetchDriverData();
  }, [driver]);

  // Get driver status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'suspended': return 'red';
      case 'pending': return 'yellow';
      case 'approved': return 'teal';
      case 'rejected': return 'red';
      case 'offline': return 'gray';
      case 'online': return 'blue';
      default: return 'gray';
    }
  };

  // Get verification status
  const getVerificationStatus = () => {
    if (!driverData.documents) return 'Not Submitted';
    
    const documents = Array.isArray(driverData.documents) ? driverData.documents : [];
    const verifiedDocs = documents.filter(d => d.status === 'verified');
    
    if (documents.length === 0) return 'Not Submitted';
    if (verifiedDocs.length === documents.length) return 'Verified';
    if (verifiedDocs.length > 0) return 'Partially Verified';
    return 'Pending Review';
  };

  // Get verification color
  const getVerificationColor = (status) => {
    switch (status) {
      case 'Verified': return 'green';
      case 'Partially Verified': return 'yellow';
      case 'Pending Review': return 'orange';
      case 'Not Submitted': return 'red';
      default: return 'gray';
    }
  };

  // Handle suspend/activate driver
  const handleToggleDriverStatus = async () => {
    const newStatus = driverData.status === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'suspended' ? 'suspend' : 'activate';

    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('drivers')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          last_updated_by: user.id,
          ...(newStatus === 'suspended' && { suspension_reason: suspendReason })
        })
        .eq('id', driverData.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: `driver_${action}ed`,
        resource_type: 'driver',
        resource_id: driverData.id,
        details: {
          driver_id: driverData.id,
          driver_name: `${driverData.first_name} ${driverData.last_name}`,
          previous_status: driverData.status,
          new_status: newStatus,
          reason: suspendReason,
          action_by: user.email
        },
        ip_address: 'admin_panel'
      });

      // Send notification to driver
      await supabase.from('notifications').insert({
        user_id: driverData.id,
        user_type: 'driver',
        title: `Account ${action === 'suspend' ? 'Suspended' : 'Activated'}`,
        message: `Your driver account has been ${action === 'suspend' ? 'suspended' : 'activated'}. ${action === 'suspend' ? `Reason: ${suspendReason}` : 'You can now accept trips.'}`,
        type: 'account',
        priority: 'high',
        metadata: {
          driver_id: driverData.id,
          status: newStatus,
          action: action
        },
        created_by: user.id
      });

      toast({
        title: 'Success',
        description: `Driver ${action}${action === 'suspend' ? 'ed' : 'd'} successfully`,
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setDriverData(prev => ({
        ...prev,
        status: newStatus,
        ...(newStatus === 'suspended' && { suspension_reason: suspendReason })
      }));

      onSuspendClose();
      setSuspendReason('');

      // Call onAction callback if provided
      if (onAction) {
        onAction(action, {
          driverId: driverData.id,
          status: newStatus,
          reason: suspendReason
        });
      }

    } catch (error) {
      console.error('Error toggling driver status:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} driver`,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle approve driver
  const handleApproveDriver = async () => {
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('drivers')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          updated_at: new Date().toISOString(),
          last_updated_by: user.id
        })
        .eq('id', driverData.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'driver_approved',
        resource_type: 'driver',
        resource_id: driverData.id,
        details: {
          driver_id: driverData.id,
          driver_name: `${driverData.first_name} ${driverData.last_name}`,
          approved_by: user.email
        },
        ip_address: 'admin_panel'
      });

      // Send notification to driver
      await supabase.from('notifications').insert({
        user_id: driverData.id,
        user_type: 'driver',
        title: 'Account Approved',
        message: 'Congratulations! Your driver account has been approved. You can now start accepting trips.',
        type: 'account',
        priority: 'high',
        metadata: {
          driver_id: driverData.id,
          status: 'approved'
        },
        created_by: user.id
      });

      toast({
        title: 'Success',
        description: 'Driver approved successfully',
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setDriverData(prev => ({
        ...prev,
        status: 'approved',
        approved_at: new Date().toISOString()
      }));

      onApproveClose();

      // Call onAction callback if provided
      if (onAction) {
        onAction('approved', {
          driverId: driverData.id,
          approvedBy: user.id
        });
      }

    } catch (error) {
      console.error('Error approving driver:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve driver',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle verify documents
  const handleVerifyDocuments = async () => {
    try {
      setActionLoading(true);
      
      // Update all documents to verified
      if (driverData.documents && Array.isArray(driverData.documents)) {
        const documentUpdates = driverData.documents.map(doc => 
          supabase
            .from('documents')
            .update({
              status: 'verified',
              verified_at: new Date().toISOString(),
              verified_by: user.id,
              verification_notes: verificationNotes,
              updated_at: new Date().toISOString()
            })
            .eq('id', doc.id)
        );

        await Promise.all(documentUpdates);
      }

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'documents_verified',
        resource_type: 'driver',
        resource_id: driverData.id,
        details: {
          driver_id: driverData.id,
          driver_name: `${driverData.first_name} ${driverData.last_name}`,
          verified_by: user.email,
          notes: verificationNotes
        },
        ip_address: 'admin_panel'
      });

      // Send notification to driver
      await supabase.from('notifications').insert({
        user_id: driverData.id,
        user_type: 'driver',
        title: 'Documents Verified',
        message: 'All your documents have been verified and approved.',
        type: 'document',
        priority: 'high',
        metadata: {
          driver_id: driverData.id,
          verification_status: 'verified'
        },
        created_by: user.id
      });

      toast({
        title: 'Success',
        description: 'Documents verified successfully',
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setDriverData(prev => ({
        ...prev,
        documents: prev.documents?.map(doc => ({
          ...doc,
          status: 'verified',
          verified_at: new Date().toISOString()
        }))
      }));

      onVerifyClose();
      setVerificationNotes('');

      // Call onAction callback if provided
      if (onAction) {
        onAction('verified', {
          driverId: driverData.id,
          verifiedBy: user.id
        });
      }

    } catch (error) {
      console.error('Error verifying documents:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify documents',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: 'Error',
        description: 'Message cannot be empty',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(true);
      
      // In a real app, you would send this via your messaging service
      // For now, we'll log it as a notification
      await supabase.from('notifications').insert({
        user_id: driverData.id,
        user_type: 'driver',
        title: 'Message from Admin',
        message: messageText,
        type: 'message',
        priority: 'medium',
        metadata: {
          sender_id: user.id,
          sender_type: 'admin',
          message_type: 'direct'
        },
        created_by: user.id
      });

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'message_sent',
        resource_type: 'driver',
        resource_id: driverData.id,
        details: {
          driver_id: driverData.id,
          driver_name: `${driverData.first_name} ${driverData.last_name}`,
          message: messageText,
          sent_by: user.email
        },
        ip_address: 'admin_panel'
      });

      toast({
        title: 'Success',
        description: 'Message sent successfully',
        status: 'success',
        duration: 3000,
      });

      onMessageClose();
      setMessageText('');

      // Call onAction callback if provided
      if (onAction) {
        onAction('messaged', {
          driverId: driverData.id,
          message: messageText
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Copy driver ID
  const copyDriverId = () => {
    navigator.clipboard.writeText(driverData.id);
    toast({
      title: 'Copied',
      description: 'Driver ID copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  if (loading) {
    return (
      <Card {...props}>
        <CardBody>
          <Text>Loading driver data...</Text>
        </CardBody>
      </Card>
    );
  }

  if (!driverData) {
    return (
      <Card {...props}>
        <CardBody>
          <Text color="gray.500">No driver data available</Text>
        </CardBody>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card {...props} _hover={{ shadow: 'md' }}>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" align="start">
              <HStack spacing={3}>
                <Avatar
                  size="md"
                  name={`${driverData.first_name} ${driverData.last_name}`}
                  src={driverData.avatar_url}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">
                    {driverData.first_name} {driverData.last_name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {driverData.phone}
                  </Text>
                  <HStack spacing={1}>
                    <StarIcon color="yellow.500" size="12px" />
                    <Text fontSize="sm">{driverData.rating || 'No rating'}</Text>
                  </HStack>
                </VStack>
              </HStack>
              
              <StatusBadge status={driverData.status} size="sm" />
            </Flex>
            
            <Divider />
            
            {driverData.vehicles && driverData.vehicles[0] && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={1}>Vehicle</Text>
                <Text fontSize="sm" color="gray.600">
                  {driverData.vehicles[0].model} • {driverData.vehicles[0].license_plate}
                </Text>
              </Box>
            )}
            
            <Divider />
            
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Tooltip label="Call Driver">
                  <IconButton
                    size="sm"
                    icon={<PhoneIcon />}
                    aria-label="Call Driver"
                    colorScheme="green"
                    variant="ghost"
                    as="a"
                    href={`tel:${driverData.phone}`}
                  />
                </Tooltip>
                
                <Tooltip label="Send Message">
                  <IconButton
                    size="sm"
                    icon={<FaBell />}
                    aria-label="Send Message"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={onMessageOpen}
                  />
                </Tooltip>
              </HStack>
              
              <Button
                size="sm"
                rightIcon={<ArrowForwardIcon />}
                variant="link"
                as="a"
                href={`/accounts/drivers/${driverData.id}`}
              >
                View
              </Button>
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
          <Flex justify="space-between" align="start">
            <HStack spacing={4}>
              <Avatar
                size="lg"
                name={`${driverData.first_name} ${driverData.last_name}`}
                src={driverData.avatar_url}
              />
              <VStack align="start" spacing={1}>
                <HStack>
                  <Text fontWeight="bold" fontSize="xl">
                    {driverData.first_name} {driverData.last_name}
                  </Text>
                  <StatusBadge status={driverData.status} />
                </HStack>
                
                <HStack spacing={4}>
                  <HStack spacing={1}>
                    <FaPhone color="gray.500" />
                    <Link href={`tel:${driverData.phone}`} color="blue.500">
                      {formatPhone(driverData.phone)}
                    </Link>
                  </HStack>
                  
                  <HStack spacing={1}>
                    <EmailIcon color="gray.500" />
                    <Link href={`mailto:${driverData.email}`} color="blue.500">
                      {driverData.email}
                    </Link>
                  </HStack>
                </HStack>
                
                <HStack spacing={3}>
                  <HStack spacing={1}>
                    <StarIcon color="yellow.500" />
                    <Text fontWeight="medium">{driverData.rating || 'No rating'}</Text>
                    <Text fontSize="sm" color="gray.500">rating</Text>
                  </HStack>
                  
                  <Badge colorScheme={getVerificationColor(getVerificationStatus())}>
                    {getVerificationStatus()}
                  </Badge>
                  
                  {driverData.created_at && (
                    <Text fontSize="sm" color="gray.500">
                      Joined {formatDate(driverData.created_at, 'date')}
                    </Text>
                  )}
                </HStack>
              </VStack>
            </HStack>
            
            <HStack spacing={2}>
              <Tooltip label="Copy Driver ID">
                <IconButton
                  size="sm"
                  icon={<CopyIcon />}
                  aria-label="Copy Driver ID"
                  onClick={copyDriverId}
                  variant="ghost"
                />
              </Tooltip>
              
              <Menu>
                <MenuButton as={IconButton} size="sm" icon={<SettingsIcon />} variant="ghost" />
                <MenuList>
                  <MenuItem icon={<ExternalLinkIcon />} as="a" href={`/accounts/drivers/${driverData.id}`}>
                    View Full Profile
                  </MenuItem>
                  <MenuItem icon={<DownloadIcon />} onClick={() => {/* Export driver data */}}>
                    Export Data
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FaHistory />} as="a" href={`/accounts/drivers/${driverData.id}/activity`}>
                    View Activity Log
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody>
          <VStack align="stretch" spacing={4}>
            {/* Vehicle Information */}
            {driverData.vehicles && driverData.vehicles[0] && (
              <Box p={4} borderWidth="1px" borderRadius="md">
                <Text fontWeight="medium" mb={3}>Vehicle Information</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Model</Text>
                    <Text fontWeight="medium">{driverData.vehicles[0].model}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">License Plate</Text>
                    <Text fontWeight="medium">{driverData.vehicles[0].license_plate}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Color</Text>
                    <Text fontWeight="medium">{driverData.vehicles[0].color || 'Not specified'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.500">Year</Text>
                    <Text fontWeight="medium">{driverData.vehicles[0].year || 'Not specified'}</Text>
                  </Box>
                  {driverData.vehicles[0].insurance_expiry && (
                    <Box>
                      <Text fontSize="sm" color="gray.500">Insurance Expiry</Text>
                      <Text fontWeight="medium">{formatDate(driverData.vehicles[0].insurance_expiry, 'date')}</Text>
                    </Box>
                  )}
                </SimpleGrid>
              </Box>
            )}
            
            {/* Statistics */}
            {showStats && stats && (
              <Box>
                <Text fontWeight="medium" mb={3}>Performance Statistics</Text>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color="gray.500">Total Trips</Text>
                    <Text fontSize="2xl" fontWeight="bold">{stats.totalTrips}</Text>
                  </Box>
                  <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color="gray.500">Completed</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.completedTrips}</Text>
                  </Box>
                  <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color="gray.500">Total Earnings</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {formatCurrency(stats.totalEarnings)}
                    </Text>
                  </Box>
                  <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color="gray.500">Acceptance Rate</Text>
                    <Text fontSize="2xl" fontWeight="bold">{stats.acceptanceRate}%</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            )}
            
            {/* Documents */}
            {driverData.documents && driverData.documents.length > 0 && (
              <Box>
                <Text fontWeight="medium" mb={3}>Documents</Text>
                <Wrap spacing={3}>
                  {driverData.documents.map((doc) => (
                    <WrapItem key={doc.id}>
                      <Badge
                        colorScheme={doc.status === 'verified' ? 'green' : doc.status === 'rejected' ? 'red' : 'yellow'}
                        px={3}
                        py={1}
                        borderRadius="md"
                      >
                        <HStack spacing={1}>
                          <FaIdCard />
                          <Text>{doc.document_type}</Text>
                          <Text fontSize="xs">({doc.status})</Text>
                        </HStack>
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            )}
            
            {/* Additional Information */}
            <Box>
              <Text fontWeight="medium" mb={2}>Additional Information</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {driverData.license_number && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Driver License</Text>
                    <Text fontWeight="medium">{driverData.license_number}</Text>
                  </Box>
                )}
                {driverData.date_of_birth && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Date of Birth</Text>
                    <Text fontWeight="medium">{formatDate(driverData.date_of_birth, 'date')}</Text>
                  </Box>
                )}
                {driverData.address && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Address</Text>
                    <Text fontWeight="medium">{driverData.address}</Text>
                  </Box>
                )}
                {driverData.current_location && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Current Location</Text>
                    <Text fontWeight="medium">{driverData.current_location}</Text>
                  </Box>
                )}
              </SimpleGrid>
            </Box>
          </VStack>
        </CardBody>
        
        <CardFooter borderTopWidth="1px">
          <HStack spacing={2} width="100%">
            <Button
              leftIcon={<PhoneIcon />}
              colorScheme="green"
              as="a"
              href={`tel:${driverData.phone}`}
              flex={1}
            >
              Call Driver
            </Button>
            
            <Button
              leftIcon={<FaBell />}
              colorScheme="blue"
              onClick={onMessageOpen}
              flex={1}
            >
              Send Message
            </Button>
            
            {driverData.status === 'pending' && hasPermission('drivers', 'approve') && (
              <Button
                leftIcon={<CheckIcon />}
                colorScheme="teal"
                onClick={onApproveOpen}
                flex={1}
              >
                Approve Driver
              </Button>
            )}
            
            {driverData.status !== 'suspended' && hasPermission('drivers', 'suspend') && (
              <Button
                leftIcon={<LockIcon />}
                colorScheme="red"
                variant="outline"
                onClick={onSuspendOpen}
                flex={1}
              >
                Suspend
              </Button>
            )}
            
            {driverData.status === 'suspended' && hasPermission('drivers', 'suspend') && (
              <Button
                leftIcon={<UnlockIcon />}
                colorScheme="green"
                variant="outline"
                onClick={onSuspendOpen}
                flex={1}
              >
                Activate
              </Button>
            )}
            
            {getVerificationStatus() !== 'Verified' && driverData.documents && driverData.documents.length > 0 && hasPermission('drivers', 'verify') && (
              <Button
                leftIcon={<FaShieldAlt />}
                colorScheme="purple"
                variant="outline"
                onClick={onVerifyOpen}
                flex={1}
              >
                Verify Documents
              </Button>
            )}
          </HStack>
        </CardFooter>
      </Card>
      
      {/* Send Message Modal */}
      <Modal isOpen={isMessageOpen} onClose={onMessageClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Message to Driver</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text>Send a message to {driverData.first_name} {driverData.last_name}</Text>
              </Alert>
              
              <FormControl isRequired>
                <FormLabel>Message</FormLabel>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  rows={4}
                />
              </FormControl>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="medium">Recipient</Text>
                  <HStack justify="space-between">
                    <Text>Driver:</Text>
                    <Text>{driverData.first_name} {driverData.last_name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Phone:</Text>
                    <Text>{formatPhone(driverData.phone)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Email:</Text>
                    <Text>{driverData.email}</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onMessageClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSendMessage}
              isLoading={actionLoading}
              loadingText="Sending..."
            >
              Send Message
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Suspend/Activate Modal */}
      <Modal isOpen={isSuspendOpen} onClose={onSuspendClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {driverData.status === 'suspended' ? 'Activate Driver' : 'Suspend Driver'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text>
                  Are you sure you want to {driverData.status === 'suspended' ? 'activate' : 'suspend'} this driver?
                </Text>
              </Alert>
              
              {driverData.status !== 'suspended' && (
                <FormControl>
                  <FormLabel>Suspension Reason (Optional)</FormLabel>
                  <Textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Provide reason for suspension..."
                    rows={3}
                  />
                </FormControl>
              )}
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="medium">Driver Details</Text>
                  <HStack justify="space-between">
                    <Text>Name:</Text>
                    <Text>{driverData.first_name} {driverData.last_name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Current Status:</Text>
                    <StatusBadge status={driverData.status} />
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Total Trips:</Text>
                    <Text>{stats?.totalTrips || 0}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Rating:</Text>
                    <Text>{driverData.rating || 'No rating'}</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSuspendClose}>
              Cancel
            </Button>
            <Button
              colorScheme={driverData.status === 'suspended' ? 'green' : 'red'}
              onClick={handleToggleDriverStatus}
              isLoading={actionLoading}
              loadingText="Processing..."
            >
              {driverData.status === 'suspended' ? 'Activate Driver' : 'Suspend Driver'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Approve Driver Modal */}
      <Modal isOpen={isApproveOpen} onClose={onApproveClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Approve Driver</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text>Approve this driver's application</Text>
              </Alert>
              
              <Box p={4} borderWidth="1px" borderRadius="md">
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="medium">Driver Information</Text>
                  <HStack justify="space-between">
                    <Text>Name:</Text>
                    <Text>{driverData.first_name} {driverData.last_name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Email:</Text>
                    <Text>{driverData.email}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Phone:</Text>
                    <Text>{formatPhone(driverData.phone)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Documents:</Text>
                    <Badge colorScheme={getVerificationColor(getVerificationStatus())}>
                      {getVerificationStatus()}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>
              
              <Text fontSize="sm" color="gray.500">
                Approving this driver will allow them to start accepting trips immediately.
              </Text>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onApproveClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleApproveDriver}
              isLoading={actionLoading}
              loadingText="Approving..."
            >
              Approve Driver
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Verify Documents Modal */}
      <Modal isOpen={isVerifyOpen} onClose={onVerifyClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Verify Documents</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text>Verify all submitted documents for this driver</Text>
              </Alert>
              
              <Box>
                <Text fontWeight="medium" mb={2}>Documents to Verify</Text>
                <VStack align="stretch" spacing={2}>
                  {driverData.documents && driverData.documents.map((doc) => (
                    <HStack key={doc.id} justify="space-between" p={2} borderWidth="1px" borderRadius="md">
                      <HStack>
                        <FaIdCard />
                        <Text>{doc.document_type}</Text>
                      </HStack>
                      <Badge colorScheme={doc.status === 'verified' ? 'green' : 'yellow'}>
                        {doc.status}
                      </Badge>
                    </HStack>
                  ))}
                </VStack>
              </Box>
              
              <FormControl>
                <FormLabel>Verification Notes (Optional)</FormLabel>
                <Textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about the verification..."
                  rows={3}
                />
              </FormControl>
              
              <Text fontSize="sm" color="gray.500">
                Verifying documents will mark all submitted documents as verified and update the driver's verification status.
              </Text>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onVerifyClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleVerifyDocuments}
              isLoading={actionLoading}
              loadingText="Verifying..."
            >
              Verify All Documents
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DriverCard;