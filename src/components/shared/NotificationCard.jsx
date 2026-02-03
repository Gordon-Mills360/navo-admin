import React, { useState, useCallback } from 'react';
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
  Flex,
  Spacer,
  useToast,
  Tooltip,
  Divider,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import {
  BellIcon,
  CheckIcon,
  CloseIcon,
  TimeIcon,
  CalendarIcon,
  ViewIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  SettingsIcon,
  DownloadIcon,
  CopyIcon,
  StarIcon,
  WarningIcon,
  InfoIcon
} from '@chakra-ui/icons';
import {
  FaBell,
  FaBellSlash,
  FaEnvelope,
  FaEnvelopeOpen,
  FaPaperPlane,
  FaInbox,
  FaArchive,
  FaTrashAlt,
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
  FaCar,
  FaCarSide,
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

// Utils
import { formatDate, truncateText } from '../../utils/formatters';

const NotificationCard = ({
  notification,
  onRead,
  onAction,
  showChannels = false,
  ...props
}) => {
  const [isRead, setIsRead] = useState(notification.read || false);
  const [isArchived, setIsArchived] = useState(notification.archived || false);
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();
  const { user } = useAuth();

  // Get notification type icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      'system': <FaBell color="blue.500" />,
      'message': <FaEnvelope color="green.500" />,
      'alert': <FaExclamationTriangle color="red.500" />,
      'warning': <FaExclamationCircle color="orange.500" />,
      'info': <FaInfoCircle color="blue.500" />,
      'success': <FaCheckCircle color="green.500" />,
      'error': <FaTimesCircle color="red.500" />,
      'trip': <FaCar color="purple.500" />,
      'payment': <FaMoneyBillWave color="green.500" />,
      'wallet': <FaCreditCard color="teal.500" />,
      'driver': <FaUserTie color="blue.500" />,
      'passenger': <FaUser color="green.500" />,
      'emergency': <FaExclamationTriangle color="red.500" />,
      'document': <FaFileAlt color="orange.500" />,
      'broadcast': <FaPaperPlane color="purple.500" />,
      'default': <BellIcon color="gray.500" />
    };
    
    return iconMap[type] || iconMap.default;
  };

  // Get notification type color
  const getNotificationColor = (type) => {
    const colorMap = {
      'system': 'blue',
      'message': 'green',
      'alert': 'red',
      'warning': 'orange',
      'info': 'blue',
      'success': 'green',
      'error': 'red',
      'trip': 'purple',
      'payment': 'green',
      'wallet': 'teal',
      'driver': 'blue',
      'passenger': 'green',
      'emergency': 'red',
      'document': 'orange',
      'broadcast': 'purple',
      'default': 'gray'
    };
    
    return colorMap[type] || colorMap.default;
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Get delivery status color
  const getDeliveryStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'green';
      case 'sent': return 'blue';
      case 'failed': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  // Handle mark as read
  const handleMarkAsRead = useCallback(async () => {
    if (isRead) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      if (error) throw error;

      setIsRead(true);
      
      // Call onRead callback if provided
      if (onRead) {
        onRead(notification.id);
      }

      toast({
        title: 'Marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [notification.id, isRead, onRead, toast]);

  // Handle archive notification
  const handleArchive = useCallback(async () => {
    if (isArchived) return;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('notifications')
        .update({
          archived: true,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      if (error) throw error;

      setIsArchived(true);
      
      toast({
        title: 'Archived',
        description: 'Notification moved to archive',
        status: 'success',
        duration: 2000,
      });

    } catch (error) {
      console.error('Error archiving notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive notification',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [notification.id, isArchived, toast]);

  // Handle delete notification
  const handleDelete = useCallback(async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notification.id);

      if (error) throw error;
      
      // Call onAction callback if provided
      if (onAction) {
        onAction('deleted', notification.id);
      }

      toast({
        title: 'Deleted',
        description: 'Notification deleted successfully',
        status: 'success',
        duration: 2000,
      });

    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [notification.id, onAction, toast]);

  // Handle action button click
  const handleAction = useCallback((action) => {
    if (onAction) {
      onAction(action, notification);
    }
  }, [notification, onAction]);

  // Format notification timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(timestamp, 'date');
  };

  // Check if notification is actionable
  const isActionable = () => {
    return notification.metadata?.action_url || notification.metadata?.action_type;
  };

  // Get action button text
  const getActionText = () => {
    if (notification.metadata?.action_text) {
      return notification.metadata.action_text;
    }
    
    switch (notification.type) {
      case 'trip': return 'View Trip';
      case 'payment': return 'View Payment';
      case 'emergency': return 'View Emergency';
      case 'document': return 'View Document';
      default: return 'View Details';
    }
  };

  // Copy notification ID
  const copyNotificationId = () => {
    navigator.clipboard.writeText(notification.id);
    toast({
      title: 'Copied',
      description: 'Notification ID copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  return (
    <Card
      {...props}
      borderLeftWidth="4px"
      borderLeftColor={isRead ? 'gray.200' : `${getNotificationColor(notification.type)}.500`}
      bg={isRead ? 'white' : `${getNotificationColor(notification.type)}.50`}
      _dark={{
        bg: isRead ? 'gray.800' : `${getNotificationColor(notification.type)}.900`
      }}
      _hover={{
        shadow: 'md',
        transform: 'translateY(-2px)',
        transition: 'all 0.2s'
      }}
    >
      <CardBody>
        <VStack align="stretch" spacing={3}>
          {/* Header */}
          <Flex justify="space-between" align="start">
            <HStack spacing={3} flex={1}>
              <Box fontSize="xl" color={`${getNotificationColor(notification.type)}.500`}>
                {getNotificationIcon(notification.type)}
              </Box>
              
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="md">
                  {notification.title}
                </Text>
                
                <HStack spacing={2}>
                  <Badge
                    colorScheme={getNotificationColor(notification.type)}
                    variant="subtle"
                    fontSize="xs"
                  >
                    {notification.type}
                  </Badge>
                  
                  {notification.priority && (
                    <Badge
                      colorScheme={getPriorityColor(notification.priority)}
                      fontSize="xs"
                    >
                      {notification.priority}
                    </Badge>
                  )}
                  
                  {!isRead && (
                    <Badge colorScheme="red" variant="solid" fontSize="xs">
                      New
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
            
            <Menu>
              <MenuButton
                as={IconButton}
                size="sm"
                icon={<ChevronDownIcon />}
                variant="ghost"
                aria-label="Notification options"
              />
              <MenuList>
                {!isRead && (
                  <MenuItem icon={<CheckIcon />} onClick={handleMarkAsRead}>
                    Mark as Read
                  </MenuItem>
                )}
                
                {!isArchived && (
                  <MenuItem icon={<FaArchive />} onClick={handleArchive}>
                    Archive
                  </MenuItem>
                )}
                
                <MenuItem icon={<CopyIcon />} onClick={copyNotificationId}>
                  Copy ID
                </MenuItem>
                
                <MenuDivider />
                
                <MenuItem icon={<FaTrashAlt />} onClick={handleDelete} color="red.500">
                  Delete
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
          
          {/* Message */}
          <Box>
            <Text fontSize="sm" color="gray.600">
              {notification.message}
            </Text>
          </Box>
          
          {/* Metadata */}
          {(notification.metadata || showChannels) && (
            <Box>
              <Divider my={2} />
              
              <Wrap spacing={2}>
                {notification.metadata?.sender && (
                  <WrapItem>
                    <Badge variant="subtle" colorScheme="gray">
                      From: {notification.metadata.sender}
                    </Badge>
                  </WrapItem>
                )}
                
                {notification.metadata?.trip_id && (
                  <WrapItem>
                    <Badge variant="subtle" colorScheme="purple">
                      Trip: {truncateText(notification.metadata.trip_id, 8)}
                    </Badge>
                  </WrapItem>
                )}
                
                {notification.metadata?.driver_id && (
                  <WrapItem>
                    <Badge variant="subtle" colorScheme="blue">
                      Driver: {truncateText(notification.metadata.driver_id, 8)}
                    </Badge>
                  </WrapItem>
                )}
                
                {notification.metadata?.passenger_id && (
                  <WrapItem>
                    <Badge variant="subtle" colorScheme="green">
                      Passenger: {truncateText(notification.metadata.passenger_id, 8)}
                    </Badge>
                  </WrapItem>
                )}
                
                {showChannels && notification.channels && (
                  <WrapItem>
                    <Badge variant="subtle" colorScheme="teal">
                      Channels: {notification.channels.join(', ')}
                    </Badge>
                  </WrapItem>
                )}
                
                {notification.delivery_status && (
                  <WrapItem>
                    <Badge
                      colorScheme={getDeliveryStatusColor(notification.delivery_status)}
                      variant="subtle"
                    >
                      {notification.delivery_status}
                    </Badge>
                  </WrapItem>
                )}
              </Wrap>
            </Box>
          )}
          
          {/* Footer */}
          <Flex justify="space-between" align="center" pt={2}>
            <HStack spacing={2}>
              <TimeIcon color="gray.500" fontSize="sm" />
              <Text fontSize="xs" color="gray.500">
                {formatTimestamp(notification.created_at)}
              </Text>
              
              {notification.expires_at && (
                <>
                  <Text fontSize="xs" color="gray.500">•</Text>
                  <Text fontSize="xs" color="gray.500">
                    Expires: {formatDate(notification.expires_at, 'date')}
                  </Text>
                </>
              )}
            </HStack>
            
            <HStack spacing={2}>
              {isActionable() && (
                <Button
                  size="xs"
                  colorScheme={getNotificationColor(notification.type)}
                  variant="solid"
                  onClick={() => handleAction('view')}
                  isLoading={loading}
                >
                  {getActionText()}
                </Button>
              )}
              
              {!isRead && (
                <Tooltip label="Mark as read">
                  <IconButton
                    size="xs"
                    icon={<CheckIcon />}
                    aria-label="Mark as read"
                    colorScheme="gray"
                    variant="ghost"
                    onClick={handleMarkAsRead}
                    isLoading={loading}
                  />
                </Tooltip>
              )}
            </HStack>
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default NotificationCard;