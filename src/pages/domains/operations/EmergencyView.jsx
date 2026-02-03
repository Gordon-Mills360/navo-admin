import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Flex, Heading, Text, Button, IconButton, Badge,
  HStack, VStack, SimpleGrid, Card, CardBody, CardHeader,
  useToast, useDisclosure, Tabs, TabList, TabPanels, Tab, TabPanel,
  Stat, StatLabel, StatNumber, StatHelpText, StatArrow,
  Table, Thead, Tbody, Tr, Th, Td, TableContainer,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, FormControl, FormLabel,
  Input, Select, Switch, Textarea, Alert, AlertIcon,
  Tooltip, Menu, MenuButton, MenuList, MenuItem, MenuGroup,
  AlertDialog, AlertDialogBody, AlertDialogFooter,
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  useColorModeValue, Divider, Avatar, Wrap, WrapItem,
  Tag, TagLabel, TagLeftIcon, TagRightIcon, Center,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  Popover, PopoverTrigger, PopoverContent, PopoverHeader,
  PopoverBody, PopoverFooter, PopoverArrow, PopoverCloseButton,
  Portal, Spinner, Progress, Skeleton, SkeletonCircle, SkeletonText,
  InputGroup, InputLeftElement, InputRightElement,
  Checkbox, CheckboxGroup, Stack, RadioGroup, Radio,
  NumberInput, NumberInputField, NumberInputStepper,
  NumberIncrementStepper, NumberDecrementStepper,
  RangeSlider, RangeSliderTrack, RangeSliderFilledTrack,
  RangeSliderThumb, Slider, SliderTrack, SliderFilledTrack,
  SliderThumb, SliderMark, Grid, GridItem,
  Accordion, AccordionItem, AccordionButton, AccordionPanel,
  AccordionIcon, Image, Link, List, ListItem, ListIcon,
  OrderedList, UnorderedList, Code, Kbd, Drawer,
  DrawerBody, DrawerFooter, DrawerHeader, DrawerOverlay,
  DrawerContent, DrawerCloseButton, CloseButton,
  Editable, EditablePreview, EditableInput,
  VisuallyHidden, CircularProgress, CircularProgressLabel,
  Collapse, Wrap as ChakraWrap
} from '@chakra-ui/react';

// Icons
import {
  SearchIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon,
  CheckIcon, CloseIcon, WarningIcon, RepeatIcon,
  DownloadIcon, CopyIcon, LockIcon, UnlockIcon,
  ChevronRightIcon, ChevronDownIcon, InfoIcon,
  PhoneIcon, EmailIcon, CalendarIcon, TimeIcon,
  ArrowUpIcon, ArrowDownIcon, ExternalLinkIcon,
  HamburgerIcon, SettingsIcon, StarIcon, FilterIcon,
  ChevronLeftIcon, ChevronUpIcon, ChevronDownIcon as ChakraChevronDownIcon,
  ArrowBackIcon, ArrowForwardIcon, ArrowRightIcon,
  AttachmentIcon, AtSignIcon, BellIcon, ChatIcon,
  CheckCircleIcon, WarningTwoIcon, NotAllowedIcon,
  DownloadIcon as ChakraDownloadIcon, SunIcon, MoonIcon,
  SmallAddIcon, SmallCloseIcon, StarIcon as ChakraStarIcon,
  UpDownIcon, TimeIcon as ChakraTimeIcon, CalendarIcon as ChakraCalendarIcon,
  InfoOutlineIcon, QuestionIcon, QuestionOutlineIcon,
  SettingsIcon as ChakraSettingsIcon, ViewIcon as ChakraViewIcon,
  ViewOffIcon, TriangleUpIcon, TriangleDownIcon,
  MinusIcon, PlusIcon, ArrowLeftIcon, ArrowRightIcon as ChakraArrowRightIcon,
  PhoneIcon as ChakraPhoneIcon, EmailIcon as ChakraEmailIcon,
  AttachmentIcon as ChakraAttachmentIcon, TimeIcon as ChakraTimeIconAlt,
  CalendarIcon as ChakraCalendarIconAlt, LocationIcon
} from '@chakra-ui/icons';
import {
  FaUserShield, FaUserTie, FaUserCheck, FaUserTimes,
  FaUserClock, FaUserLock, FaUserCog, FaChartLine,
  FaHistory, FaKey, FaBell, FaShieldAlt, FaDatabase,
  FaFilter, FaFileExport, FaFilePdf, FaFileCsv,
  FaFileExcel, FaSearch, FaCalendarAlt, FaClock,
  FaUser, FaCog, FaEye, FaEyeSlash, FaTrash,
  FaRedo, FaUndo, FaExclamationTriangle, FaInfoCircle,
  FaTable, FaColumns, FaSort, FaSortUp, FaSortDown,
  FaExpand, FaCompress, FaSave, FaPrint, FaShare,
  FaLink, FaUnlink, FaCopy, FaPaste, FaCut,
  FaBold, FaItalic, FaUnderline, FaStrikethrough,
  FaList, FaListOl, FaListUl, FaQuoteRight,
  FaCode, FaSuperscript, FaSubscript, FaParagraph,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify,
  FaIndent, FaOutdent, FaFont, FaHeading,
  FaImage, FaVideo, FaMusic, FaFilm,
  FaMapMarker, FaMapMarkerAlt, FaGlobe, FaGlobeAmericas,
  FaPhone, FaPhoneAlt, FaEnvelope, FaEnvelopeOpen,
  FaPaperPlane, FaInbox, FaArchive, FaTrashAlt,
  FaFolder, FaFolderOpen, FaFile, FaFileAlt,
  FaFileArchive, FaFileCode, FaFileImage, FaFileVideo,
  FaFileAudio, FaFileWord, FaFilePowerpoint, FaFileExcel as FaFileExcelIcon,
  FaFilePdf as FaFilePdfIcon, FaFileSignature, FaFileContract,
  FaFileMedical, FaFileInvoice, FaFileInvoiceDollar,
  FaFileUpload, FaFileDownload, FaFileImport, FaFileExport as FaFileExportIcon,
  FaCloudUploadAlt, FaCloudDownloadAlt, FaSync, FaSyncAlt,
  FaRedoAlt, FaUndoAlt, FaRandom, FaRetweet,
  FaExchangeAlt, FaShuffle, FaRandom as FaRandomIcon,
  FaNetworkWired, FaServer, FaDatabase as FaDatabaseIcon,
  FaHdd, FaMemory, FaMicrochip, FaMicroprocessor,
  FaDesktop, FaLaptop, FaTabletAlt, FaMobileAlt,
  FaMobile, FaPhoneSquare, FaPhoneSquareAlt,
  FaChartBar, FaChartPie, FaChartArea, FaLineChart,
  FaBarChart, FaPieChart, FaAreaChart, FaChartBar as FaChartBarIcon,
  FaUserTag, FaUserFriends, FaUserPlus, FaUserMinus,
  FaUserEdit, FaUserSecret, FaUserNinja, FaUserGraduate,
  FaUserMd, FaUserInjured, FaUserAstronaut, FaUserCheck as FaUserCheckIcon,
  FaUserTimes as FaUserTimesIcon, FaUserLock as FaUserLockIcon,
  FaUserCog as FaUserCogIcon, FaUserShield as FaUserShieldIcon,
  FaUserTie as FaUserTieIcon, FaUserClock as FaUserClockIcon,
  FaUsers, FaUsersCog, FaUserCircle, FaUserAlt,
  FaIdCard, FaIdCardAlt, FaAddressCard, FaAddressBook,
  FaUserTag as FaUserTagIcon, FaUserFriends as FaUserFriendsIcon,
  FaUserPlus as FaUserPlusIcon, FaUserMinus as FaUserMinusIcon,
  FaUserEdit as FaUserEditIcon, FaUserSecret as FaUserSecretIcon,
  FaUserNinja as FaUserNinjaIcon, FaUserGraduate as FaUserGraduateIcon,
  FaUserMd as FaUserMdIcon, FaUserInjured as FaUserInjuredIcon,
  FaUserAstronaut as FaUserAstronautIcon,
  FaAmbulance, FaFirstAid, FaHospital, FaHospitalAlt,
  FaHospitalSymbol, FaMedkit, FaStethoscope, FaUserMd as FaUserMdIcon2,
  FaUserInjured as FaUserInjuredIcon2, FaHeartbeat, FaHeart,
  FaShieldVirus, FaViruses, FaVirus, FaVirusSlash,
  FaBiohazard, FaRadiation, FaRadiationAlt, FaSkullCrossbones,
  FaExclamation, FaExclamationCircle, FaFire, FaFireAlt,
  FaCarCrash, FaCarAlt, FaCar, FaTrafficLight,
  FaRoad, FaMap, FaMapPin, FaMapMarked,
  FaMapMarkedAlt, FaLocationArrow, FaCrosshairs,
  FaCompass, FaRoute, FaStreetView, FaTrafficLight as FaTrafficLightIcon,
  FaWalking, FaRunning, FaBicycle, FaMotorcycle,
  FaBus, FaTaxi, FaTrain, FaSubway,
  FaTruck, FaTruckMonster, FaTruckPickup, FaTruckMoving,
  FaGasPump, FaWrench, FaToolbox, FaTools,
  FaCogs, FaCog as FaCogIcon, FaWrench as FaWrenchIcon,
  FaHammer, FaScrewdriver, FaPlug, FaBolt,
  FaCarBattery, FaCarSide, FaOilCan, FaTire,
  FaTireRugged, FaTireFlat, FaTirePressureWarning,
  FaTrafficLight as FaTrafficLightIcon2
} from 'react-icons/fa';

// Services & Contexts
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';

// Components
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import StatusBadge from '../../../components/shared/StatusBadge';
import ActionLog from '../../../components/shared/ActionLog';
import EmergencyAlert from '../../../components/shared/EmergencyAlert';

// Utils
import { formatDate, formatPhone, truncateText } from '../../../utils/formatters';

const EmergencyView = () => {
  // Get emergency ID from URL
  const [emergencyId, setEmergencyId] = useState(null);
  const [emergency, setEmergency] = useState(null);
  const [actions, setActions] = useState([]);
  const [trip, setTrip] = useState(null);
  const [driver, setDriver] = useState(null);
  const [passenger, setPassenger] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [note, setNote] = useState('');
  const [actionType, setActionType] = useState('note');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('');
  const [assignTo, setAssignTo] = useState('');
  
  // Modal states
  const { isOpen: isAddActionOpen, onOpen: onAddActionOpen, onClose: onAddActionClose } = useDisclosure();
  const { isOpen: isChangeStatusOpen, onOpen: onChangeStatusOpen, onClose: onChangeStatusClose } = useDisclosure();
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure();
  const { isOpen: isEscalateOpen, onOpen: onEscalateOpen, onClose: onEscalateClose } = useDisclosure();
  const { isOpen: isResolveOpen, onOpen: onResolveOpen, onClose: onResolveClose } = useDisclosure();
  const { isOpen: isAttachmentOpen, onOpen: onAttachmentOpen, onClose: onAttachmentClose } = useDisclosure();
  
  // Context hooks
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const toast = useToast();
  
  // Color values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headerBg = useColorModeValue('gray.50', 'gray.900');
  const criticalBg = useColorModeValue('red.50', 'red.900');
  const warningBg = useColorModeValue('orange.50', 'orange.900');
  const infoBg = useColorModeValue('blue.50', 'blue.900');
  
  // Get emergency ID from URL
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    setEmergencyId(id);
  }, []);
  
  // Fetch emergency data
  const fetchEmergencyData = useCallback(async () => {
    if (!emergencyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch emergency
      const { data: emergencyData, error: emergencyError } = await supabase
        .from('emergencies')
        .select(`
          *,
          driver:driver_id (
            id, first_name, last_name, phone, email, 
            license_number, vehicle_model, vehicle_plate,
            current_location, rating, status
          ),
          passenger:passenger_id (
            id, first_name, last_name, phone, email,
            current_location, rating, status
          ),
          trip:trip_id (
            id, pickup_location, dropoff_location,
            fare, status, started_at, completed_at
          )
        `)
        .eq('id', emergencyId)
        .single();
      
      if (emergencyError) throw emergencyError;
      
      setEmergency(emergencyData);
      setDriver(emergencyData.driver);
      setPassenger(emergencyData.passenger);
      setTrip(emergencyData.trip);
      
      // Fetch emergency actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('emergency_actions')
        .select(`
          *,
          admin:admin_id (
            id, first_name, last_name, email, role
          )
        `)
        .eq('emergency_id', emergencyId)
        .order('created_at', { ascending: true });
      
      if (actionsError) throw actionsError;
      setActions(actionsData || []);
      
      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .storage
        .from('emergency-attachments')
        .list(emergencyId);
      
      if (!attachmentsError && attachmentsData) {
        setAttachments(attachmentsData);
      }
      
      // Update view count
      await supabase
        .from('emergencies')
        .update({ views: (emergencyData.views || 0) + 1 })
        .eq('id', emergencyId);
      
    } catch (err) {
      console.error('Error fetching emergency data:', err);
      setError(err.message || 'Failed to load emergency details');
      toast({
        title: 'Error',
        description: 'Failed to load emergency details',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [emergencyId, toast]);
  
  // Set up real-time subscription
  useEffect(() => {
    if (!emergencyId) return;
    
    const subscription = supabase
      .channel(`emergency_${emergencyId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'emergency_actions',
          filter: `emergency_id=eq.${emergencyId}`
        },
        () => {
          fetchEmergencyData();
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'emergencies',
          filter: `id=eq.${emergencyId}`
        },
        () => {
          fetchEmergencyData();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [emergencyId, fetchEmergencyData]);
  
  // Initial fetch
  useEffect(() => {
    if (emergencyId) {
      fetchEmergencyData();
    }
  }, [emergencyId, fetchEmergencyData]);
  
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
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'red';
      case 'acknowledged': return 'orange';
      case 'investigating': return 'blue';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'gray';
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
      case 'weather': return <FaCloudUploadAlt />;
      default: return <FaExclamationTriangle />;
    }
  };
  
  // Add action to emergency
  const handleAddAction = async () => {
    if (!note.trim() && actionType === 'note') {
      toast({
        title: 'Error',
        description: 'Note is required',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    try {
      setActionLoading(true);
      
      const actionData = {
        emergency_id: emergencyId,
        admin_id: user.id,
        action_type: actionType,
        priority: priority,
        details: {
          note: note,
          status_change: actionType === 'status_change' ? status : null,
          assignment: actionType === 'assign' ? assignTo : null,
          escalated_to: actionType === 'escalate' ? 'authorities' : null
        },
        metadata: {
          user_agent: navigator.userAgent,
          ip_address: 'admin_panel'
        }
      };
      
      const { data, error } = await supabase
        .from('emergency_actions')
        .insert([actionData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Update emergency if status changed
      if (actionType === 'status_change' && status) {
        await supabase
          .from('emergencies')
          .update({ 
            status: status,
            updated_at: new Date().toISOString(),
            last_updated_by: user.id
          })
          .eq('id', emergencyId);
      }
      
      // Log to admin actions
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'emergency_action_added',
        resource_type: 'emergency',
        resource_id: emergencyId,
        details: {
          emergency_id: emergencyId,
          action_type: actionType,
          priority: priority,
          note: note
        },
        ip_address: 'admin_panel'
      });
      
      // Send notification if assigned
      if (actionType === 'assign' && assignTo) {
        await supabase.from('notifications').insert({
          user_id: assignTo,
          user_type: 'admin',
          title: 'Emergency Assigned',
          message: `Emergency #${emergencyId} has been assigned to you. Priority: ${priority}`,
          type: 'emergency',
          priority: 'high',
          metadata: { emergency_id: emergencyId },
          created_by: user.id
        });
      }
      
      toast({
        title: 'Success',
        description: 'Action added successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Reset form
      setNote('');
      setActionType('note');
      setPriority('medium');
      setStatus('');
      setAssignTo('');
      
      onAddActionClose();
      
    } catch (err) {
      console.error('Error adding action:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to add action',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Resolve emergency
  const handleResolveEmergency = async () => {
    try {
      setActionLoading(true);
      
      // Update emergency status
      const { error: updateError } = await supabase
        .from('emergencies')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_updated_by: user.id
        })
        .eq('id', emergencyId);
      
      if (updateError) throw updateError;
      
      // Add resolution action
      const { error: actionError } = await supabase
        .from('emergency_actions')
        .insert([{
          emergency_id: emergencyId,
          admin_id: user.id,
          action_type: 'resolve',
          priority: 'low',
          details: {
            note: 'Emergency resolved',
            resolved_by: user.email
          }
        }]);
      
      if (actionError) throw actionError;
      
      // Log to admin actions
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'emergency_resolved',
        resource_type: 'emergency',
        resource_id: emergencyId,
        details: {
          emergency_id: emergencyId,
          resolved_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: 'Emergency resolved successfully',
        status: 'success',
        duration: 3000,
      });
      
      onResolveClose();
      
    } catch (err) {
      console.error('Error resolving emergency:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to resolve emergency',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Escalate emergency
  const handleEscalateEmergency = async () => {
    try {
      setActionLoading(true);
      
      // Update emergency status
      const { error: updateError } = await supabase
        .from('emergencies')
        .update({ 
          status: 'escalated',
          escalated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_updated_by: user.id
        })
        .eq('id', emergencyId);
      
      if (updateError) throw updateError;
      
      // Add escalation action
      const { error: actionError } = await supabase
        .from('emergency_actions')
        .insert([{
          emergency_id: emergencyId,
          admin_id: user.id,
          action_type: 'escalate',
          priority: 'critical',
          details: {
            note: 'Emergency escalated to authorities',
            escalated_to: 'local_authorities'
          }
        }]);
      
      if (actionError) throw actionError;
      
      // Log to admin actions
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'emergency_escalated',
        resource_type: 'emergency',
        resource_id: emergencyId,
        details: {
          emergency_id: emergencyId,
          escalated_to: 'authorities',
          escalated_by: user.email
        },
        ip_address: 'admin_panel'
      });
      
      toast({
        title: 'Success',
        description: 'Emergency escalated to authorities',
        status: 'success',
        duration: 3000,
      });
      
      onEscalateClose();
      
    } catch (err) {
      console.error('Error escalating emergency:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to escalate emergency',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Upload attachment
  const handleUploadAttachment = async (file) => {
    try {
      setActionLoading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${emergencyId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('emergency-attachments')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Add attachment action
      const { error: actionError } = await supabase
        .from('emergency_actions')
        .insert([{
          emergency_id: emergencyId,
          admin_id: user.id,
          action_type: 'attachment_added',
          priority: 'low',
          details: {
            note: `Attachment uploaded: ${file.name}`,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size
          }
        }]);
      
      if (actionError) throw actionError;
      
      toast({
        title: 'Success',
        description: 'Attachment uploaded successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Refresh attachments
      const { data: attachmentsData } = await supabase
        .storage
        .from('emergency-attachments')
        .list(emergencyId);
      
      setAttachments(attachmentsData || []);
      
    } catch (err) {
      console.error('Error uploading attachment:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to upload attachment',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  // Get file icon
  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return <FaFileImage />;
    if (fileType.includes('pdf')) return <FaFilePdf />;
    if (fileType.includes('word')) return <FaFileWord />;
    if (fileType.includes('excel')) return <FaFileExcel />;
    if (fileType.includes('video')) return <FaFileVideo />;
    if (fileType.includes('audio')) return <FaFileAudio />;
    return <FaFile />;
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Loading state
  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Emergency Details</Heading>
        </Flex>
        <LoadingSpinner text="Loading emergency details..." fullPage={false} />
      </Box>
    );
  }
  
  // Error state
  if (error || !emergency) {
    return (
      <Box p={6}>
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Error loading emergency</Text>
            <Text fontSize="sm">{error || 'Emergency not found'}</Text>
          </Box>
        </Alert>
        <Button
          leftIcon={<ArrowBackIcon />}
          onClick={() => window.history.back()}
          colorScheme="blue"
        >
          Back to Emergencies
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" spacing={1}>
          <HStack>
            <Heading size="lg">Emergency #{emergency.id.slice(0, 8)}</Heading>
            <Badge
              colorScheme={getSeverityColor(emergency.severity)}
              fontSize="md"
              px={3}
              py={1}
            >
              {emergency.severity?.toUpperCase()}
            </Badge>
            <StatusBadge
              status={emergency.status}
              variant="solid"
              size="lg"
            />
          </HStack>
          <Text color="gray.500" fontSize="sm">
            {emergency.type} • {formatDate(emergency.created_at, 'full')}
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="outline"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          
          {hasPermission('emergencies', 'respond') && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onAddActionOpen}
            >
              Add Action
            </Button>
          )}
        </HStack>
      </Flex>
      
      {/* Emergency Alert Banner */}
      <Box mb={6}>
        <EmergencyAlert
          emergency={emergency}
          onAcknowledge={() => {
            setActionType('status_change');
            setStatus('acknowledged');
            onAddActionOpen();
          }}
          onResolve={onResolveOpen}
        />
      </Box>
      
      {/* Main Content Grid */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} mb={6}>
        {/* Left Column - Emergency Details */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <VStack spacing={6} align="stretch">
            {/* Emergency Details Card */}
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                <Heading size="md">Emergency Details</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Type</Text>
                    <HStack spacing={2}>
                      {getEmergencyTypeIcon(emergency.type)}
                      <Text>{emergency.type}</Text>
                    </HStack>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Severity</Text>
                    <Badge
                      colorScheme={getSeverityColor(emergency.severity)}
                      px={3}
                      py={1}
                    >
                      {emergency.severity}
                    </Badge>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Status</Text>
                    <StatusBadge
                      status={emergency.status}
                      variant="subtle"
                    />
                  </Box>
                  
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Priority</Text>
                    <Badge
                      colorScheme={getSeverityColor(emergency.severity)}
                      variant="outline"
                      px={3}
                      py={1}
                    >
                      {emergency.severity}
                    </Badge>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Reported At</Text>
                    <Text>{formatDate(emergency.created_at, 'full')}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="medium" color="gray.500" fontSize="sm">Last Updated</Text>
                    <Text>{formatDate(emergency.updated_at, 'full')}</Text>
                  </Box>
                  
                  {emergency.resolved_at && (
                    <Box>
                      <Text fontWeight="medium" color="gray.500" fontSize="sm">Resolved At</Text>
                      <Text>{formatDate(emergency.resolved_at, 'full')}</Text>
                    </Box>
                  )}
                  
                  {emergency.escalated_at && (
                    <Box>
                      <Text fontWeight="medium" color="gray.500" fontSize="sm">Escalated At</Text>
                      <Text>{formatDate(emergency.escalated_at, 'full')}</Text>
                    </Box>
                  )}
                </SimpleGrid>
                
                <Divider my={4} />
                
                <Box>
                  <Text fontWeight="medium" color="gray.500" fontSize="sm" mb={2}>Description</Text>
                  <Card bg={subtleBg} p={4}>
                    <Text>{emergency.description || 'No description provided'}</Text>
                  </Card>
                </Box>
                
                {emergency.location && (
                  <>
                    <Divider my={4} />
                    <Box>
                      <Text fontWeight="medium" color="gray.500" fontSize="sm" mb={2}>Location</Text>
                      <Card bg={subtleBg} p={4}>
                        <Text>{emergency.location}</Text>
                        {emergency.latitude && emergency.longitude && (
                          <Link
                            color="blue.500"
                            href={`https://maps.google.com/?q=${emergency.latitude},${emergency.longitude}`}
                            target="_blank"
                            mt={2}
                            display="inline-block"
                          >
                            <HStack>
                              <FaMapMarkerAlt />
                              <Text>View on Google Maps</Text>
                            </HStack>
                          </Link>
                        )}
                      </Card>
                    </Box>
                  </>
                )}
              </CardBody>
            </Card>
            
            {/* Action Log */}
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                <Heading size="md">Action Timeline</Heading>
              </CardHeader>
              <CardBody>
                <ActionLog
                  actions={actions.map(action => ({
                    id: action.id,
                    type: action.action_type,
                    timestamp: action.created_at,
                    user: action.admin ? {
                      name: `${action.admin.first_name} ${action.admin.last_name}`,
                      role: action.admin.role
                    } : null,
                    details: action.details,
                    priority: action.priority
                  }))}
                  maxHeight="500px"
                  showAdmin={true}
                />
              </CardBody>
            </Card>
            
            {/* Attachments */}
            {attachments.length > 0 && (
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                  <Heading size="md">Attachments</Heading>
                </CardHeader>
                <CardBody>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {attachments.map((file) => {
                      const fileUrl = supabase.storage
                        .from('emergency-attachments')
                        .getPublicUrl(`${emergencyId}/${file.name}`).data.publicUrl;
                      
                      return (
                        <Card key={file.name} variant="outline" _hover={{ shadow: 'md' }}>
                          <CardBody>
                            <VStack spacing={3}>
                              <Box fontSize="3xl" color="blue.500">
                                {getFileIcon(file.metadata?.mimetype || '')}
                              </Box>
                              <VStack spacing={1}>
                                <Text fontWeight="medium" textAlign="center" noOfLines={2}>
                                  {file.name}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  {formatFileSize(file.metadata?.size || 0)}
                                </Text>
                              </VStack>
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  leftIcon={<ViewIcon />}
                                  onClick={() => window.open(fileUrl, '_blank')}
                                >
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  leftIcon={<DownloadIcon />}
                                  as="a"
                                  href={fileUrl}
                                  download
                                >
                                  Download
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                </CardBody>
              </Card>
            )}
          </VStack>
        </GridItem>
        
        {/* Right Column - Contact & Quick Actions */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* Trip Information */}
            {trip && (
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                  <Heading size="md">Trip Information</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Box>
                      <Text fontWeight="medium" color="gray.500" fontSize="sm">Trip ID</Text>
                      <Link
                        color="blue.500"
                        href={`/operations/trips/${trip.id}`}
                        fontWeight="medium"
                      >
                        #{trip.id.slice(0, 8)}
                      </Link>
                    </Box>
                    
                    <Box>
                      <Text fontWeight="medium" color="gray.500" fontSize="sm">Status</Text>
                      <StatusBadge status={trip.status} />
                    </Box>
                    
                    {trip.pickup_location && (
                      <Box>
                        <Text fontWeight="medium" color="gray.500" fontSize="sm">Pickup Location</Text>
                        <Text fontSize="sm">{trip.pickup_location}</Text>
                      </Box>
                    )}
                    
                    {trip.dropoff_location && (
                      <Box>
                        <Text fontWeight="medium" color="gray.500" fontSize="sm">Dropoff Location</Text>
                        <Text fontSize="sm">{trip.dropoff_location}</Text>
                      </Box>
                    )}
                    
                    {trip.fare && (
                      <Box>
                        <Text fontWeight="medium" color="gray.500" fontSize="sm">Fare</Text>
                        <Text fontSize="sm">${trip.fare}</Text>
                      </Box>
                    )}
                    
                    {trip.started_at && (
                      <Box>
                        <Text fontWeight="medium" color="gray.500" fontSize="sm">Started At</Text>
                        <Text fontSize="sm">{formatDate(trip.started_at, 'datetime')}</Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}
            
            {/* Driver Information */}
            {driver && (
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                  <Heading size="md">Driver Information</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack spacing={3}>
                      <Avatar
                        size="lg"
                        name={`${driver.first_name} ${driver.last_name}`}
                        src={driver.avatar_url}
                      />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">
                          {driver.first_name} {driver.last_name}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Driver
                        </Text>
                        <HStack>
                          <StarIcon color="yellow.500" />
                          <Text fontSize="sm">{driver.rating || 'No rating'}</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    <Divider />
                    
                    <Box>
                      <Text fontWeight="medium" color="gray.500" fontSize="sm">Contact</Text>
                      <VStack align="start" spacing={1} mt={1}>
                        {driver.phone && (
                          <HStack spacing={2}>
                            <PhoneIcon color="gray.500" />
                            <Link
                              href={`tel:${driver.phone}`}
                              color="blue.500"
                              fontSize="sm"
                            >
                              {formatPhone(driver.phone)}
                            </Link>
                          </HStack>
                        )}
                        
                        {driver.email && (
                          <HStack spacing={2}>
                            <EmailIcon color="gray.500" />
                            <Link
                              href={`mailto:${driver.email}`}
                              color="blue.500"
                              fontSize="sm"
                            >
                              {driver.email}
                            </Link>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                    
                    {driver.license_number && (
                      <Box>
                        <Text fontWeight="medium" color="gray.500" fontSize="sm">License</Text>
                        <Text fontSize="sm">{driver.license_number}</Text>
                      </Box>
                    )}
                    
                    {driver.vehicle_model && driver.vehicle_plate && (
                      <Box>
                        <Text fontWeight="medium" color="gray.500" fontSize="sm">Vehicle</Text>
                        <Text fontSize="sm">
                          {driver.vehicle_model} • {driver.vehicle_plate}
                        </Text>
                      </Box>
                    )}
                    
                    <Divider />
                    
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<PhoneIcon />}
                        colorScheme="green"
                        as="a"
                        href={`tel:${driver.phone}`}
                        flex={1}
                      >
                        Call Driver
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<FaUser />}
                        variant="outline"
                        as="a"
                        href={`/accounts/drivers/${driver.id}`}
                        flex={1}
                      >
                        View Profile
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            )}
            
            {/* Passenger Information */}
            {passenger && (
              <Card bg={cardBg} border="1px" borderColor={borderColor}>
                <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                  <Heading size="md">Passenger Information</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <HStack spacing={3}>
                      <Avatar
                        size="lg"
                        name={`${passenger.first_name} ${passenger.last_name}`}
                        src={passenger.avatar_url}
                      />
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">
                          {passenger.first_name} {passenger.last_name}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Passenger
                        </Text>
                        <HStack>
                          <StarIcon color="yellow.500" />
                          <Text fontSize="sm">{passenger.rating || 'No rating'}</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    <Divider />
                    
                    <Box>
                      <Text fontWeight="medium" color="gray.500" fontSize="sm">Contact</Text>
                      <VStack align="start" spacing={1} mt={1}>
                        {passenger.phone && (
                          <HStack spacing={2}>
                            <PhoneIcon color="gray.500" />
                            <Link
                              href={`tel:${passenger.phone}`}
                              color="blue.500"
                              fontSize="sm"
                            >
                              {formatPhone(passenger.phone)}
                            </Link>
                          </HStack>
                        )}
                        
                        {passenger.email && (
                          <HStack spacing={2}>
                            <EmailIcon color="gray.500" />
                            <Link
                              href={`mailto:${passenger.email}`}
                              color="blue.500"
                              fontSize="sm"
                            >
                              {passenger.email}
                            </Link>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                    
                    <Divider />
                    
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<PhoneIcon />}
                        colorScheme="green"
                        as="a"
                        href={`tel:${passenger.phone}`}
                        flex={1}
                      >
                        Call Passenger
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<FaUser />}
                        variant="outline"
                        as="a"
                        href={`/accounts/passengers/${passenger.id}`}
                        flex={1}
                      >
                        View Profile
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            )}
            
            {/* Quick Actions */}
            <Card bg={cardBg} border="1px" borderColor={borderColor}>
              <CardHeader bg={headerBg} borderBottom="1px" borderColor={borderColor}>
                <Heading size="md">Quick Actions</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {hasPermission('emergencies', 'respond') && (
                    <>
                      <Button
                        leftIcon={<FaExclamationTriangle />}
                        colorScheme="red"
                        onClick={onEscalateOpen}
                        isDisabled={emergency.status === 'escalated' || emergency.status === 'resolved'}
                      >
                        Escalate to Authorities
                      </Button>
                      
                      <Button
                        leftIcon={<CheckCircleIcon />}
                        colorScheme="green"
                        onClick={onResolveOpen}
                        isDisabled={emergency.status === 'resolved'}
                      >
                        Mark as Resolved
                      </Button>
                      
                      <Button
                        leftIcon={<EditIcon />}
                        colorScheme="blue"
                        onClick={() => {
                          setActionType('status_change');
                          onChangeStatusOpen();
                        }}
                      >
                        Change Status
                      </Button>
                      
                      <Button
                        leftIcon={<FaUserTie />}
                        colorScheme="purple"
                        onClick={() => {
                          setActionType('assign');
                          onAssignOpen();
                        }}
                      >
                        Assign to Admin
                      </Button>
                      
                      <Button
                        leftIcon={<ChakraAttachmentIcon />}
                        variant="outline"
                        onClick={onAttachmentOpen}
                      >
                        Upload Attachment
                      </Button>
                    </>
                  )}
                  
                  <Button
                    leftIcon={<DownloadIcon />}
                    variant="outline"
                    onClick={async () => {
                      // Generate emergency report
                      const reportData = {
                        emergency,
                        driver,
                        passenger,
                        trip,
                        actions,
                        generated_at: new Date().toISOString(),
                        generated_by: user.email
                      };
                      
                      const dataStr = JSON.stringify(reportData, null, 2);
                      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                      
                      const link = document.createElement('a');
                      link.href = dataUri;
                      link.download = `emergency_${emergency.id}_report.json`;
                      link.click();
                    }}
                  >
                    Download Report
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </GridItem>
      </SimpleGrid>
      
      {/* Add Action Modal */}
      <Modal isOpen={isAddActionOpen} onClose={onAddActionClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Action to Emergency</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Action Type</FormLabel>
                <Select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                >
                  <option value="note">Add Note</option>
                  <option value="status_change">Change Status</option>
                  <option value="assign">Assign to Admin</option>
                  <option value="escalate">Escalate</option>
                  <option value="contact">Contact Made</option>
                  <option value="follow_up">Follow Up</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Priority</FormLabel>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </Select>
              </FormControl>
              
              {actionType === 'status_change' && (
                <FormControl>
                  <FormLabel>New Status</FormLabel>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="open">Open</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>
                </FormControl>
              )}
              
              {actionType === 'assign' && (
                <FormControl>
                  <FormLabel>Assign To Admin</FormLabel>
                  <Input
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                    placeholder="Enter admin email or ID"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Enter the email or ID of the admin to assign this emergency to
                  </Text>
                </FormControl>
              )}
              
              <FormControl isRequired={actionType === 'note'}>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter details about this action..."
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAddActionClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAddAction}
              isLoading={actionLoading}
              loadingText="Adding..."
              isDisabled={actionType === 'note' && !note.trim()}
            >
              Add Action
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Resolve Confirmation Modal */}
      <ConfirmationModal
        isOpen={isResolveOpen}
        onClose={onResolveClose}
        onConfirm={handleResolveEmergency}
        title="Resolve Emergency"
        message="Are you sure you want to mark this emergency as resolved?"
        type="warning"
        confirmText="Mark as Resolved"
        isLoading={actionLoading}
      />
      
      {/* Escalate Confirmation Modal */}
      <ConfirmationModal
        isOpen={isEscalateOpen}
        onClose={onEscalateClose}
        onConfirm={handleEscalateEmergency}
        title="Escalate Emergency"
        message="Are you sure you want to escalate this emergency to authorities?"
        type="warning"
        confirmText="Escalate to Authorities"
        isLoading={actionLoading}
      />
      
      {/* Upload Attachment Modal */}
      <Modal isOpen={isAttachmentOpen} onClose={onAttachmentClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Attachment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Text fontSize="sm">
                  Upload images, documents, or other files related to this emergency
                </Text>
              </Alert>
              
              <Box
                border="2px dashed"
                borderColor="gray.300"
                borderRadius="md"
                p={6}
                textAlign="center"
                _hover={{ borderColor: 'blue.500' }}
              >
                <Input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleUploadAttachment(e.target.files[0]);
                      onAttachmentClose();
                    }
                  }}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <VStack spacing={3} cursor="pointer">
                    <ChakraAttachmentIcon fontSize="3xl" color="gray.500" />
                    <Text fontWeight="medium">Click to upload file</Text>
                    <Text fontSize="sm" color="gray.500">
                      Supports images, PDFs, documents
                    </Text>
                    <Button colorScheme="blue" size="sm">
                      Browse Files
                    </Button>
                  </VStack>
                </label>
              </Box>
              
              <Text fontSize="sm" color="gray.500">
                Maximum file size: 10MB
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onAttachmentClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EmergencyView;