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
  FaUser,
  FaUserFriends,
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
  FaShieldAlt,
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
import WalletCard from './WalletCard';

// Utils
import { formatDate, formatPhone, formatCurrency } from '../../utils/formatters';

const PassengerCard = ({
  passenger,
  compact = false,
  showStats = true,
  onAction,
  ...props
}) => {
  const [passengerData, setPassengerData] = useState(passenger);
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { isOpen: isCallOpen, onOpen: onCallOpen, onClose: onCallClose } = useDisclosure();
  const { isOpen: isMessageOpen, onOpen: onMessageOpen, onClose: onMessageClose } = useDisclosure();
  const { isOpen: isSuspendOpen, onOpen: onSuspendOpen, onClose: onSuspendClose } = useDisclosure();
  const { isOpen: isWalletOpen, onOpen: onWalletOpen, onClose: onWalletClose } = useDisclosure();
  
  const [suspendReason, setSuspendReason] = useState('');
  const [messageText, setMessageText] = useState('');
  
  const toast = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermission();

  // Fetch passenger data if only ID provided
  useEffect(() => {
    const fetchPassengerData = async () => {
      if (passenger && typeof passenger === 'string') {
        try {
          setLoading(true);
          
          // Fetch passenger data
          const { data: passengerData, error: passengerError } = await supabase
            .from('passengers')
            .select(`
              *,
              trips(
                id,
                status,
                fare,
                created_at,
                driver_id
              ),
              wallet:wallet_id (*)
            `)
            .eq('id', passenger)
            .single();
          
          if (passengerError) throw passengerError;
          
          setPassengerData(passengerData);
          
          if (passengerData.wallet) {
            setWallet(passengerData.wallet);
          }
          
          // Calculate stats
          const trips = passengerData.trips || [];
          const completedTrips = trips.filter(t => t.status === 'completed').length;
          const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
          const totalSpent = trips
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.fare || 0), 0);
          const averageRating = passengerData.rating || 0;
          
          setStats({
            totalTrips: trips.length,
            completedTrips,
            cancelledTrips,
            totalSpent,
            averageRating,
            completionRate: trips.length > 0 ? Math.round((completedTrips / trips.length) * 100) : 0,
            cancellationRate: trips.length > 0 ? Math.round((cancelledTrips / trips.length) * 100) : 0
          });
          
        } catch (error) {
          console.error('Error fetching passenger data:', error);
        } finally {
          setLoading(false);
        }
      } else if (passenger) {
        setPassengerData(passenger);
        
        // Calculate stats if trips data available
        if (passenger.trips) {
          const trips = passenger.trips;
          const completedTrips = trips.filter(t => t.status === 'completed').length;
          const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
          const totalSpent = trips
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + (t.fare || 0), 0);
          const averageRating = passenger.rating || 0;
          
          setStats({
            totalTrips: trips.length,
            completedTrips,
            cancelledTrips,
            totalSpent,
            averageRating,
            completionRate: trips.length > 0 ? Math.round((completedTrips / trips.length) * 100) : 0,
            cancellationRate: trips.length > 0 ? Math.round((cancelledTrips / trips.length) * 100) : 0
          });
        }
        
        if (passenger.wallet) {
          setWallet(passenger.wallet);
        }
      }
    };
    
    fetchPassengerData();
  }, [passenger]);

  // Get passenger status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'inactive': return 'gray';
      case 'suspended': return 'red';
      case 'pending': return 'yellow';
      case 'verified': return 'teal';
      case 'blocked': return 'red';
      default: return 'gray';
    }
  };

  // Get trust score color
  const getTrustScoreColor = (score) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  };

  // Handle suspend/activate passenger
  const handleTogglePassengerStatus = async () => {
    const newStatus = passengerData.status === 'suspended' ? 'active' : 'suspended';
    const action = newStatus === 'suspended' ? 'suspend' : 'activate';

    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('passengers')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          last_updated_by: user.id,
          ...(newStatus === 'suspended' && { suspension_reason: suspendReason })
        })
        .eq('id', passengerData.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: `passenger_${action}ed`,
        resource_type: 'passenger',
        resource_id: passengerData.id,
        details: {
          passenger_id: passengerData.id,
          passenger_name: `${passengerData.first_name} ${passengerData.last_name}`,
          previous_status: passengerData.status,
          new_status: newStatus,
          reason: suspendReason,
          action_by: user.email
        },
        ip_address: 'admin_panel'
      });

      // Send notification to passenger
      await supabase.from('notifications').insert({
        user_id: passengerData.id,
        user_type: 'passenger',
        title: `Account ${action === 'suspend' ? 'Suspended' : 'Activated'}`,
        message: `Your passenger account has been ${action === 'suspend' ? 'suspended' : 'activated'}. ${action === 'suspend' ? `Reason: ${suspendReason}` : 'You can now book trips again.'}`,
        type: 'account',
        priority: 'high',
        metadata: {
          passenger_id: passengerData.id,
          status: newStatus,
          action: action
        },
        created_by: user.id
      });

      toast({
        title: 'Success',
        description: `Passenger ${action}${action === 'suspend' ? 'ed' : 'd'} successfully`,
        status: 'success',
        duration: 3000,
      });

      // Update local state
      setPassengerData(prev => ({
        ...prev,
        status: newStatus,
        ...(newStatus === 'suspended' && { suspension_reason: suspendReason })
      }));

      onSuspendClose();
      setSuspendReason('');

      // Call onAction callback if provided
      if (onAction) {
        onAction(action, {
          passengerId: passengerData.id,
          status: newStatus,
          reason: suspendReason
        });
      }

    } catch (error) {
      console.error('Error toggling passenger status:', error);
      toast({
        title: 'Error',
        description: error.message || `Failed to ${action} passenger`,
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
      
      // Send notification as message
      await supabase.from('notifications').insert({
        user_id: passengerData.id,
        user_type: 'passenger',
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
        resource_type: 'passenger',
        resource_id: passengerData.id,
        details: {
          passenger_id: passengerData.id,
          passenger_name: `${passengerData.first_name} ${passengerData.last_name}`,
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
          passengerId: passengerData.id,
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

  // Copy passenger ID
  const copyPassengerId = () => {
    navigator.clipboard.writeText(passengerData.id);
    toast({
      title: 'Copied',
      description: 'Passenger ID copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  // Get wallet balance
  const getWalletBalance = () => {
    if (!wallet) return 'No wallet';
    return formatCurrency(wallet.balance || 0);
  };

  if (loading) {
    return (
      <Card {...props}>
        <CardBody>
          <Text>Loading passenger data...</Text>
        </CardBody>
      </Card>
    );
  }

  if (!passengerData) {
    return (
      <Card {...props}>
        <CardBody>
          <Text color="gray.500">No passenger data available</Text>
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
                  name={`${passengerData.first_name} ${passengerData.last_name}`}
                  src={passengerData.avatar_url}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold">
                    {passengerData.first_name} {passengerData.last_name}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {passengerData.phone}
                  </Text>
                  <HStack spacing={1}>
                    <StarIcon color="yellow.500" size="12px" />
                    <Text fontSize="sm">{passengerData.rating || 'No rating'}</Text>
                  </HStack>
                </VStack>
              </HStack>
              
              <StatusBadge status={passengerData.status} size="sm" />
            </Flex>
            
            <Divider />
            
            {stats && (
              <SimpleGrid columns={2} spacing={2}>
                <Box>
                  <Text fontSize="xs" color="gray.500">Total Trips</Text>
                  <Text fontSize="sm" fontWeight="medium">{stats.totalTrips}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">Total Spent</Text>
                  <Text fontSize="sm" fontWeight="medium" color="green.500">
                    {formatCurrency(stats.totalSpent)}
                  </Text>
                </Box>
              </SimpleGrid>
            )}
            
            <Divider />
            
            <Flex justify="space-between" align="center">
              <HStack spacing={2}>
                <Tooltip label="Call Passenger">
                  <IconButton
                    size="sm"
                    icon={<PhoneIcon />}
                    aria-label="Call Passenger"
                    colorScheme="green"
                    variant="ghost"
                    as="a"
                    href={`tel:${passengerData.phone}`}
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
                href={`/accounts/passengers/${passengerData.id}`}
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
                name={`${passengerData.first_name} ${passengerData.last_name}`}
                src={passengerData.avatar_url}
              />
              <VStack align="start" spacing={1}>
                <HStack>
                  <Text fontWeight="bold" fontSize="xl">
                    {passengerData.first_name} {passengerData.last_name}
                  </Text>
                  <StatusBadge status={passengerData.status} />
                </HStack>
                
                <HStack spacing={4}>
                  <HStack spacing={1}>
                    <FaPhone color="gray.500" />
                    <Link href={`tel:${passengerData.phone}`} color="blue.500">
                      {formatPhone(passengerData.phone)}
                    </Link>
                  </HStack>
                  
                  <HStack spacing={1}>
                    <EmailIcon color="gray.500" />
                    <Link href={`mailto:${passengerData.email}`} color="blue.500">
                      {passengerData.email}
                    </Link>
                  </HStack>
                </HStack>
                
                <HStack spacing={3}>
                  <HStack spacing={1}>
                    <StarIcon color="yellow.500" />
                    <Text fontWeight="medium">{passengerData.rating || 'No rating'}</Text>
                    <Text fontSize="sm" color="gray.500">rating</Text>
                  </HStack>
                  
                  {passengerData.trust_score && (
                    <Badge colorScheme={getTrustScoreColor(passengerData.trust_score)}>
                      Trust Score: {passengerData.trust_score}
                    </Badge>
                  )}
                  
                  {passengerData.created_at && (
                    <Text fontSize="sm" color="gray.500">
                      Joined {formatDate(passengerData.created_at, 'date')}
                    </Text>
                  )}
                </HStack>
              </VStack>
            </HStack>
            
            <HStack spacing={2}>
              <Tooltip label="Copy Passenger ID">
                <IconButton
                  size="sm"
                  icon={<CopyIcon />}
                  aria-label="Copy Passenger ID"
                  onClick={copyPassengerId}
                  variant="ghost"
                />
              </Tooltip>
              
              <Menu>
                <MenuButton as={IconButton} size="sm" icon={<SettingsIcon />} variant="ghost" />
                <MenuList>
                  <MenuItem icon={<ExternalLinkIcon />} as="a" href={`/accounts/passengers/${passengerData.id}`}>
                    View Full Profile
                  </MenuItem>
                  <MenuItem icon={<DownloadIcon />} onClick={() => {/* Export passenger data */}}>
                    Export Data
                  </MenuItem>
                  <MenuItem icon={<FaMoneyBillWave />} onClick={onWalletOpen}>
                    View Wallet
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem icon={<FaHistory />} as="a" href={`/accounts/passengers/${passengerData.id}/activity`}>
                    View Activity Log
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </CardHeader>
        
        <CardBody>
          <VStack align="stretch" spacing={4}>
            {/* Statistics */}
            {showStats && stats && (
              <Box>
                <Text fontWeight="medium" mb={3}>Trip Statistics</Text>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                  <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color="gray.500">Total Trips</Text>
                    <Text fontSize="2xl" fontWeight="bold">{stats.totalTrips}</Text>
                  </Box>
                  <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color="gray.500">Completed</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.completedTrips}</Text>
                    <Text fontSize="xs" color="gray.500">{stats.completionRate}% rate</Text>
                  </Box>
                  <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color="gray.500">Total Spent</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.500">
                      {formatCurrency(stats.totalSpent)}
                    </Text>
                  </Box>
                  <Box p={3} borderWidth="1px" borderRadius="md" textAlign="center">
                    <Text fontSize="sm" color="gray.500">Cancelled</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="red.500">{stats.cancelledTrips}</Text>
                    <Text fontSize="xs" color="gray.500">{stats.cancellationRate}% rate</Text>
                  </Box>
                </SimpleGrid>
              </Box>
            )}
            
            {/* Wallet Information */}
            <Box p={4} borderWidth="1px" borderRadius="md">
              <Flex justify="space-between" align="center" mb={3}>
                <Text fontWeight="medium">Wallet</Text>
                <Button size="sm" variant="link" onClick={onWalletOpen}>
                  Manage
                </Button>
              </Flex>
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">Balance</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.500">
                    {getWalletBalance()}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">Status</Text>
                  {wallet ? (
                    <Badge colorScheme={wallet.status === 'active' ? 'green' : 'red'}>
                      {wallet.status}
                    </Badge>
                  ) : (
                    <Text fontSize="sm" color="gray.500">No wallet</Text>
                  )}
                </Box>
              </SimpleGrid>
            </Box>
            
            {/* Additional Information */}
            <Box>
              <Text fontWeight="medium" mb={2}>Additional Information</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {passengerData.date_of_birth && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Date of Birth</Text>
                    <Text fontWeight="medium">{formatDate(passengerData.date_of_birth, 'date')}</Text>
                  </Box>
                )}
                {passengerData.address && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Address</Text>
                    <Text fontWeight="medium">{passengerData.address}</Text>
                  </Box>
                )}
                {passengerData.preferred_payment_method && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Preferred Payment</Text>
                    <Text fontWeight="medium">{passengerData.preferred_payment_method}</Text>
                  </Box>
                )}
                {passengerData.current_location && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Current Location</Text>
                    <Text fontWeight="medium">{passengerData.current_location}</Text>
                  </Box>
                )}
              </SimpleGrid>
            </Box>
            
            {/* Preferences */}
            {(passengerData.preferences || passengerData.notes) && (
              <Box>
                <Text fontWeight="medium" mb={2}>Preferences & Notes</Text>
                {passengerData.preferences && (
                  <Box mb={2}>
                    <Text fontSize="sm" color="gray.500">Preferences:</Text>
                    <Text fontSize="sm">{passengerData.preferences}</Text>
                  </Box>
                )}
                {passengerData.notes && (
                  <Box>
                    <Text fontSize="sm" color="gray.500">Admin Notes:</Text>
                    <Text fontSize="sm">{passengerData.notes}</Text>
                  </Box>
                )}
              </Box>
            )}
          </VStack>
        </CardBody>
        
        <CardFooter borderTopWidth="1px">
          <HStack spacing={2} width="100%">
            <Button
              leftIcon={<PhoneIcon />}
              colorScheme="green"
              as="a"
              href={`tel:${passengerData.phone}`}
              flex={1}
            >
              Call Passenger
            </Button>
            
            <Button
              leftIcon={<FaBell />}
              colorScheme="blue"
              onClick={onMessageOpen}
              flex={1}
            >
              Send Message
            </Button>
            
            {passengerData.status !== 'suspended' && hasPermission('users', 'suspend') && (
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
            
            {passengerData.status === 'suspended' && hasPermission('users', 'suspend') && (
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
            
            <Button
              leftIcon={<ExternalLinkIcon />}
              variant="outline"
              as="a"
              href={`/accounts/passengers/${passengerData.id}`}
              flex={1}
            >
              View Profile
            </Button>
          </HStack>
        </CardFooter>
      </Card>
      
      {/* Send Message Modal */}
      <Modal isOpen={isMessageOpen} onClose={onMessageClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Message to Passenger</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text>Send a message to {passengerData.first_name} {passengerData.last_name}</Text>
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
                    <Text>Passenger:</Text>
                    <Text>{passengerData.first_name} {passengerData.last_name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Phone:</Text>
                    <Text>{formatPhone(passengerData.phone)}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Email:</Text>
                    <Text>{passengerData.email}</Text>
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
            {passengerData.status === 'suspended' ? 'Activate Passenger' : 'Suspend Passenger'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text>
                  Are you sure you want to {passengerData.status === 'suspended' ? 'activate' : 'suspend'} this passenger?
                </Text>
              </Alert>
              
              {passengerData.status !== 'suspended' && (
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
                  <Text fontWeight="medium">Passenger Details</Text>
                  <HStack justify="space-between">
                    <Text>Name:</Text>
                    <Text>{passengerData.first_name} {passengerData.last_name}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Current Status:</Text>
                    <StatusBadge status={passengerData.status} />
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Total Trips:</Text>
                    <Text>{stats?.totalTrips || 0}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Rating:</Text>
                    <Text>{passengerData.rating || 'No rating'}</Text>
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
              colorScheme={passengerData.status === 'suspended' ? 'green' : 'red'}
              onClick={handleTogglePassengerStatus}
              isLoading={actionLoading}
              loadingText="Processing..."
            >
              {passengerData.status === 'suspended' ? 'Activate Passenger' : 'Suspend Passenger'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Wallet Modal */}
      <Modal isOpen={isWalletOpen} onClose={onWalletClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Wallet: {passengerData.first_name} {passengerData.last_name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {wallet ? (
              <WalletCard
                wallet={wallet}
                showActions={true}
                onAction={(action, data) => {
                  if (onAction) {
                    onAction('wallet_' + action, data);
                  }
                  onWalletClose();
                }}
              />
            ) : (
              <VStack spacing={4} align="stretch">
                <Alert status="info">
                  <AlertIcon />
                  <Text>No wallet found for this passenger</Text>
                </Alert>
                
                <Button
                  colorScheme="blue"
                  onClick={async () => {
                    try {
                      setActionLoading(true);
                      
                      // Create wallet for passenger
                      const { data: newWallet, error } = await supabase
                        .from('wallets')
                        .insert({
                          user_id: passengerData.id,
                          user_type: 'passenger',
                          balance: 0,
                          status: 'active',
                          created_by: user.id
                        })
                        .select()
                        .single();
                      
                      if (error) throw error;
                      
                      setWallet(newWallet);
                      
                      toast({
                        title: 'Success',
                        description: 'Wallet created successfully',
                        status: 'success',
                        duration: 3000,
                      });
                      
                    } catch (error) {
                      console.error('Error creating wallet:', error);
                      toast({
                        title: 'Error',
                        description: error.message || 'Failed to create wallet',
                        status: 'error',
                        duration: 5000,
                      });
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  isLoading={actionLoading}
                  loadingText="Creating..."
                >
                  Create Wallet
                </Button>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" onClick={onWalletClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PassengerCard;