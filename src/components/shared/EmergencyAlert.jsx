import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  HStack,
  VStack,
  Text,
  Button,
  IconButton,
  Badge,
  Progress,
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
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import {
  CloseIcon,
  WarningIcon,
  TimeIcon,
  BellIcon,
  PhoneIcon,
  EmailIcon,
  CheckIcon,
  ArrowForwardIcon,
  ExternalLinkIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ViewIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import {
  FaExclamationTriangle,
  FaExclamationCircle,
  FaCarCrash,
  FaFirstAid,
  FaUserInjured,
  FaAmbulance,
  FaHospital,
  FaPolice,
  FaFireExtinguisher,
  FaFire,
  FaRadiation,
  FaBiohazard,
  FaSkullCrossbones,
  FaShieldAlt,
  FaUserShield,
  FaBell,
  FaBellSlash,
  FaVolumeUp,
  FaVolumeMute,
  FaClock,
  FaHistory,
  FaMapMarkerAlt,
  FaRoute,
  FaWalking,
  FaRunning,
  FaCar,
  FaCarSide,
  FaMotorcycle,
  FaBicycle,
  FaBus,
  FaTaxi,
  FaTrain,
  FaSubway,
  FaTruck,
  FaTrafficLight,
  FaRoad,
  FaMap,
  FaMapPin,
  FaMapMarked,
  FaMapMarkedAlt,
  FaLocationArrow,
  FaCrosshairs,
  FaCompass,
  FaStreetView,
  FaCloud,
  FaCloudSun,
  FaCloudMoon,
  FaCloudRain,
  FaCloudShowersHeavy,
  FaBolt,
  FaSnowflake,
  FaWind,
  FaTemperatureHigh,
  FaTemperatureLow,
  FaThermometerHalf,
  FaThermometerFull,
  FaThermometerEmpty,
  FaThermometerQuarter,
  FaThermometerThreeQuarters,
  FaTachometerAlt,
  FaTachometerAltFast,
  FaTachometerAltAverage,
  FaTachometerAltSlow,
  FaCogs,
  FaCog,
  FaUserCog,
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
  FaVolumeUp as FaVolumeUpIcon,
  FaVolumeDown,
  FaVolumeMute as FaVolumeMuteIcon,
  FaVolumeOff,
  FaBell as FaBellIcon,
  FaBellSlash as FaBellSlashIcon,
  FaExclamationTriangle as FaExclamationTriangleIcon,
  FaExclamationCircle as FaExclamationCircleIcon,
  FaInfoCircle,
  FaQuestionCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaBan,
  FaLock,
  FaUnlock,
  FaShieldAlt as FaShieldAltIcon,
  FaUserShield as FaUserShieldIcon,
  FaUserLock,
  FaUserSecret,
  FaUserNinja,
  FaUserAstronaut,
  FaUserMd,
  FaUserInjured as FaUserInjuredIcon,
  FaUserGraduate,
  FaUserTie,
  FaUserEdit,
  FaUserPlus,
  FaUserMinus,
  FaUserTag,
  FaUserFriends,
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
  FaFileExport,
  FaCloudUploadAlt,
  FaCloudDownloadAlt,
  FaSync,
  FaSyncAlt,
  FaRedoAlt,
  FaUndoAlt,
  FaRandom,
  FaRetweet,
  FaExchangeAlt,
  FaShuffle,
  FaRandom as FaRandomIcon
} from 'react-icons/fa';

// Services
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

// Utils
import { formatDate, formatPhone } from '../../utils/formatters';

const EmergencyAlert = ({
  emergency,
  onAcknowledge,
  onResolve,
  count = 1,
  showCount = true,
  showActions = true,
  autoClose = false,
  autoCloseTime = 30, // seconds
  ...props
}) => {
  const [timeLeft, setTimeLeft] = useState(autoCloseTime);
  const [isVisible, setIsVisible] = useState(true);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { user } = useAuth();

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return <FaExclamationTriangle />;
      case 'high': return <FaExclamationCircle />;
      case 'medium': return <WarningIcon />;
      case 'low': return <InfoIcon />;
      default: return <BellIcon />;
    }
  };

  // Get emergency type icon
  const getEmergencyTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'accident': return <FaCarCrash />;
      case 'medical': return <FaFirstAid />;
      case 'safety': return <FaUserShield />;
      case 'vehicle': return <FaCar />;
      case 'road': return <FaRoad />;
      case 'weather': return <FaCloud />;
      case 'police': return <FaPolice />;
      case 'fire': return <FaFire />;
      case 'hazard': return <FaBiohazard />;
      default: return <FaExclamationTriangle />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'red';
      case 'acknowledged': return 'orange';
      case 'investigating': return 'blue';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      case 'escalated': return 'purple';
      default: return 'gray';
    }
  };

  // Auto-close countdown
  useEffect(() => {
    if (!autoClose || !isVisible || isAcknowledged || isResolved) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsVisible(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoClose, isVisible, isAcknowledged, isResolved]);

  // Handle acknowledge
  const handleAcknowledge = useCallback(async () => {
    if (!onAcknowledge || !emergency) return;

    try {
      setIsAcknowledged(true);
      
      // Update emergency status
      await supabase
        .from('emergencies')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', emergency.id);

      // Log action
      await supabase.from('emergency_actions').insert({
        emergency_id: emergency.id,
        admin_id: user?.id,
        action_type: 'acknowledged',
        details: {
          note: 'Emergency acknowledged by admin',
          acknowledged_by: user?.email
        }
      });

      // Call parent callback
      if (onAcknowledge) onAcknowledge();

      toast({
        title: 'Emergency Acknowledged',
        description: 'Emergency has been acknowledged',
        status: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Error acknowledging emergency:', error);
      setIsAcknowledged(false);
      
      toast({
        title: 'Error',
        description: 'Failed to acknowledge emergency',
        status: 'error',
        duration: 5000,
      });
    }
  }, [emergency, user, onAcknowledge, toast]);

  // Handle resolve
  const handleResolve = useCallback(async () => {
    if (!onResolve || !emergency) return;

    try {
      setIsResolved(true);
      
      // Update emergency status
      await supabase
        .from('emergencies')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', emergency.id);

      // Log action
      await supabase.from('emergency_actions').insert({
        emergency_id: emergency.id,
        admin_id: user?.id,
        action_type: 'resolved',
        details: {
          note: 'Emergency resolved by admin',
          resolved_by: user?.email
        }
      });

      // Call parent callback
      if (onResolve) onResolve();

      toast({
        title: 'Emergency Resolved',
        description: 'Emergency has been resolved',
        status: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Error resolving emergency:', error);
      setIsResolved(false);
      
      toast({
        title: 'Error',
        description: 'Failed to resolve emergency',
        status: 'error',
        duration: 5000,
      });
    }
  }, [emergency, user, onResolve, toast]);

  // Handle view details
  const handleViewDetails = useCallback(() => {
    if (emergency?.id) {
      window.location.href = `/operations/emergencies/${emergency.id}`;
    }
  }, [emergency]);

  // If not visible, return null
  if (!isVisible) return null;

  // If no emergency but we have count (for multiple emergencies view)
  if (!emergency && count > 0) {
    return (
      <Alert
        status="warning"
        borderRadius="md"
        variant="left-accent"
        {...props}
      >
        <AlertIcon />
        <Box flex="1">
          <AlertTitle>{count} Active Emergencies</AlertTitle>
          <AlertDescription>
            There are {count} emergencies requiring attention
          </AlertDescription>
        </Box>
        <Button
          size="sm"
          colorScheme="orange"
          rightIcon={<ArrowForwardIcon />}
          onClick={() => window.location.href = '/operations/emergencies'}
        >
          View All
        </Button>
      </Alert>
    );
  }

  // If no emergency data
  if (!emergency) return null;

  // Check if emergency is already resolved or closed
  if (['resolved', 'closed'].includes(emergency.status?.toLowerCase())) {
    return null;
  }

  return (
    <>
      <Alert
        status={getSeverityColor(emergency.severity)}
        borderRadius="md"
        variant="solid"
        {...props}
      >
        <AlertIcon boxSize="24px">
          {getSeverityIcon(emergency.severity)}
        </AlertIcon>
        
        <Box flex="1">
          <Flex align="center" mb={1}>
            <AlertTitle mr={2}>
              Emergency #{emergency.id?.slice(0, 8) || 'N/A'}
            </AlertTitle>
            
            <HStack spacing={2}>
              <Badge colorScheme={getSeverityColor(emergency.severity)}>
                {emergency.severity?.toUpperCase()}
              </Badge>
              
              <Badge colorScheme={getStatusColor(emergency.status)}>
                {emergency.status}
              </Badge>
              
              <HStack spacing={1}>
                {getEmergencyTypeIcon(emergency.type)}
                <Text fontSize="sm">{emergency.type}</Text>
              </HStack>
            </HStack>
          </Flex>
          
          <AlertDescription maxWidth="100%">
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium">{emergency.description || 'No description provided'}</Text>
              
              <HStack spacing={4} fontSize="sm" color="whiteAlpha.800">
                {emergency.location && (
                  <HStack spacing={1}>
                    <FaMapMarkerAlt />
                    <Text>{emergency.location}</Text>
                  </HStack>
                )}
                
                {emergency.created_at && (
                  <HStack spacing={1}>
                    <FaClock />
                    <Text>{formatDate(emergency.created_at, 'time')}</Text>
                  </HStack>
                )}
                
                {showCount && count > 1 && (
                  <Badge colorScheme="whiteAlpha" variant="solid">
                    +{count - 1} more
                  </Badge>
                )}
              </HStack>
            </VStack>
          </AlertDescription>
        </Box>
        
        {showActions && (
          <HStack spacing={2} ml={4}>
            {emergency.status?.toLowerCase() === 'open' && (
              <Button
                size="sm"
                colorScheme="whiteAlpha"
                variant="solid"
                leftIcon={<CheckIcon />}
                onClick={handleAcknowledge}
                isLoading={isAcknowledged}
              >
                Acknowledge
              </Button>
            )}
            
            <Button
              size="sm"
              colorScheme="whiteAlpha"
              variant="outline"
              leftIcon={<ViewIcon />}
              onClick={handleViewDetails}
            >
              View Details
            </Button>
            
            <Button
              size="sm"
              colorScheme="whiteAlpha"
              variant="solid"
              leftIcon={<FaCheckCircle />}
              onClick={handleResolve}
              isLoading={isResolved}
            >
              Resolve
            </Button>
            
            <IconButton
              size="sm"
              icon={<CloseIcon />}
              aria-label="Dismiss"
              colorScheme="whiteAlpha"
              variant="ghost"
              onClick={() => setIsVisible(false)}
            />
          </HStack>
        )}
      </Alert>
      
      {/* Auto-close countdown */}
      {autoClose && timeLeft > 0 && !isAcknowledged && !isResolved && (
        <Progress
          value={(timeLeft / autoCloseTime) * 100}
          size="xs"
          colorScheme={getSeverityColor(emergency.severity)}
          borderRadius="md"
          mt={1}
        />
      )}
      
      {/* Emergency Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Emergency Details
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {emergency && (
              <VStack spacing={4} align="stretch">
                {/* Emergency Info */}
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Emergency #{emergency.id?.slice(0, 8)}</Text>
                      <Badge colorScheme={getSeverityColor(emergency.severity)}>
                        {emergency.severity}
                      </Badge>
                    </HStack>
                    
                    <Text>{emergency.description}</Text>
                    
                    <HStack spacing={4}>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="gray.500">Type</Text>
                        <HStack>
                          {getEmergencyTypeIcon(emergency.type)}
                          <Text>{emergency.type}</Text>
                        </HStack>
                      </VStack>
                      
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="gray.500">Status</Text>
                        <Badge colorScheme={getStatusColor(emergency.status)}>
                          {emergency.status}
                        </Badge>
                      </VStack>
                      
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm" color="gray.500">Reported</Text>
                        <Text>{formatDate(emergency.created_at, 'datetime')}</Text>
                      </VStack>
                    </HStack>
                    
                    {emergency.location && (
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Location</Text>
                        <HStack>
                          <FaMapMarkerAlt />
                          <Text>{emergency.location}</Text>
                        </HStack>
                      </Box>
                    )}
                  </VStack>
                </Box>
                
                {/* Quick Actions */}
                <HStack spacing={2}>
                  {emergency.status?.toLowerCase() === 'open' && (
                    <Button
                      leftIcon={<CheckIcon />}
                      colorScheme="green"
                      onClick={handleAcknowledge}
                      isLoading={isAcknowledged}
                      flex={1}
                    >
                      Acknowledge
                    </Button>
                  )}
                  
                  <Button
                    leftIcon={<FaCheckCircle />}
                    colorScheme="blue"
                    onClick={handleResolve}
                    isLoading={isResolved}
                    flex={1}
                  >
                    Resolve
                  </Button>
                  
                  <Button
                    leftIcon={<ExternalLinkIcon />}
                    variant="outline"
                    onClick={handleViewDetails}
                    flex={1}
                  >
                    Full Details
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EmergencyAlert;