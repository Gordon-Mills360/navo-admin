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
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  InputGroup,
  InputLeftAddon,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Stack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import {
  SearchIcon,
  FilterIcon,
  DownloadIcon,
  RepeatIcon,
  CalendarIcon,
  ChevronDownIcon,
  ViewIcon,
  EditIcon,
  DeleteIcon,
  CopyIcon,
  TimeIcon,
  StarIcon,
  AddIcon,
  PlayIcon,
  AttachmentIcon,
  ChevronRightIcon,
  BellIcon,
  EmailIcon,
  ChatIcon,
  CheckIcon,
} from '@chakra-ui/icons';
import { 
  FaBullhorn, 
  FaUserFriends, 
  FaMobileAlt,
  FaPaperPlane,
  FaChartLine
} from 'react-icons/fa';
import { supabase } from '../../../services/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../contexts/PermissionContext';
import { useNotification } from '../../../contexts/NotificationContext';
import useNotifications from '../../../hooks/useNotifications';
import DataTable from '../../../components/shared/DataTable';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';

const Notifications = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const { showNotification } = useNotification();
  const { sendNotification, getNotifications, getNotificationStats } = useNotifications();
  
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stats, setStats] = useState(null);
  
  // Modal states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isCreateOpen, 
    onOpen: onCreateOpen, 
    onClose: onCreateClose 
  } = useDisclosure();
  const { 
    isOpen: isPreviewOpen, 
    onOpen: onPreviewOpen, 
    onClose: onPreviewClose 
  } = useDisclosure();
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
  const [createForm, setCreateForm] = useState({
    title: '',
    message: '',
    notification_type: 'push',
    audience_type: 'all_users',
    specific_users: [],
    send_immediately: true,
    scheduled_time: '',
    channels: ['push', 'email'],
    priority: 'normal',
  });
  const [previewContent, setPreviewContent] = useState('');

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getNotifications({
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
        search: searchQuery || undefined,
      });
      
      if (fetchError) throw fetchError;
      
      setNotifications(data || []);
      
      // Fetch stats
      const { data: statsData } = await getNotificationStats();
      setStats(statsData);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [getNotifications, getNotificationStats, statusFilter, typeFilter, searchQuery, toast]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Handle send notification
  const handleSendNotification = async () => {
    if (!createForm.title || !createForm.message) {
      toast({
        title: 'Missing information',
        description: 'Please fill in title and message',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await sendNotification({
        title: createForm.title,
        message: createForm.message,
        type: createForm.notification_type,
        audience: createForm.audience_type,
        specific_users: createForm.specific_users,
        channels: createForm.channels,
        priority: createForm.priority,
        scheduled_time: createForm.send_immediately ? null : createForm.scheduled_time,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Notification sent',
        description: 'Notification has been sent successfully',
        status: 'success',
        duration: 3000,
      });
      
      // Refresh notifications
      fetchNotifications();
      onCreateClose();
      setCreateForm({
        title: '',
        message: '',
        notification_type: 'push',
        audience_type: 'all_users',
        specific_users: [],
        send_immediately: true,
        scheduled_time: '',
        channels: ['push', 'email'],
        priority: 'normal',
      });
      
      // Log the action
      await supabase.from('admin_actions_log').insert({
        admin_id: user.id,
        action_type: 'send_notification',
        resource_type: 'notification',
        details: { 
          title: createForm.title,
          audience: createForm.audience_type,
          channels: createForm.channels 
        },
        ip_address: 'admin_panel',
      });
      
    } catch (err) {
      toast({
        title: 'Failed to send notification',
        description: err.message || 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle preview notification
  const handlePreviewNotification = () => {
    setPreviewContent(createForm.message);
    onPreviewOpen();
  };

  // Handle view details
  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    onDetailOpen();
  };

  // Handle resend notification
  const handleResendNotification = (notification) => {
    setSelectedNotification(notification);
    setModalConfig({
      title: 'Resend Notification',
      message: `Are you sure you want to resend "${notification.title}"?`,
      action: 'resend',
      type: 'confirm',
    });
    onOpen();
  };

  // Handle delete notification
  const handleDeleteNotification = (notification) => {
    setSelectedNotification(notification);
    setModalConfig({
      title: 'Delete Notification',
      message: `Are you sure you want to delete "${notification.title}"? This action cannot be undone.`,
      action: 'delete',
      type: 'warning',
    });
    onOpen();
  };

  // Handle create form changes
  const handleCreateChange = (field, value) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'sent': return 'green';
      case 'scheduled': return 'yellow';
      case 'failed': return 'red';
      case 'draft': return 'gray';
      case 'processing': return 'blue';
      default: return 'gray';
    }
  };

  // Get type icon
  const getTypeIcon = (type) => {
    switch(type) {
      case 'push': return <FaMobileAlt />;
      case 'email': return <EmailIcon />;
      case 'sms': return <ChatIcon />;
      case 'in_app': return <BellIcon />;
      default: return <BellIcon />;
    }
  };

  // Get audience label
  const getAudienceLabel = (audience) => {
    switch(audience) {
      case 'all_users': return 'All Users';
      case 'drivers': return 'Drivers Only';
      case 'passengers': return 'Passengers Only';
      case 'specific_users': return 'Specific Users';
      case 'segment': return 'User Segment';
      default: return audience;
    }
  };

  // Table columns configuration
  const columns = [
    {
      header: 'Notification',
      accessor: 'title',
      cell: (row) => (
        <Box>
          <Text fontWeight="medium">{row.title}</Text>
          <Text fontSize="sm" color="gray.500" noOfLines={1}>
            {row.message}
          </Text>
        </Box>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      cell: (row) => (
        <HStack>
          <Box color="blue.500">{getTypeIcon(row.type)}</Box>
          <Text textTransform="capitalize">{row.type}</Text>
        </HStack>
      ),
    },
    {
      header: 'Audience',
      accessor: 'audience',
      cell: (row) => (
        <Text fontSize="sm">{getAudienceLabel(row.audience)}</Text>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <Badge colorScheme={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Sent',
      accessor: 'sent_at',
      cell: (row) => (
        row.sent_at ? (
          <VStack align="start" spacing={0}>
            <Text fontSize="sm">{new Date(row.sent_at).toLocaleDateString()}</Text>
            <Text fontSize="xs" color="gray.500">
              {new Date(row.sent_at).toLocaleTimeString()}
            </Text>
          </VStack>
        ) : (
          <Text fontSize="sm" color="gray.500">Not sent</Text>
        )
      ),
    },
    {
      header: 'Stats',
      accessor: 'stats',
      cell: (row) => (
        <HStack spacing={2}>
          <Tooltip label="Delivered">
            <Badge colorScheme="green">{row.delivered_count || 0}</Badge>
          </Tooltip>
          <Tooltip label="Opened">
            <Badge colorScheme="blue">{row.opened_count || 0}</Badge>
          </Tooltip>
        </HStack>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      cell: (row) => (
        <HStack spacing={1}>
          <Tooltip label="View Details">
            <IconButton
              icon={<ViewIcon />}
              size="sm"
              variant="ghost"
              onClick={() => handleViewDetails(row)}
            />
          </Tooltip>
          {row.status === 'sent' && hasPermission('notifications', 'resend') && (
            <Tooltip label="Resend">
              <IconButton
                icon={<RepeatIcon />}
                size="sm"
                colorScheme="blue"
                variant="ghost"
                onClick={() => handleResendNotification(row)}
              />
            </Tooltip>
          )}
          {hasPermission('notifications', 'delete') && (
            <Tooltip label="Delete">
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => handleDeleteNotification(row)}
              />
            </Tooltip>
          )}
        </HStack>
      ),
    },
  ];

  // Filtered notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (loading && notifications.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading notifications...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load notifications</Text>
          <Text>{error}</Text>
          <Button mt={3} onClick={fetchNotifications} leftIcon={<RepeatIcon />}>
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
          <Heading size="lg">Notification Management</Heading>
          <Text color="gray.600" mt={1}>
            Send and manage notifications to users
          </Text>
        </Box>
        <HStack spacing={3}>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={fetchNotifications}
            isLoading={loading}
            variant="outline"
          >
            Refresh
          </Button>
          {hasPermission('notifications', 'send') && (
            <Button
              leftIcon={<AddIcon />}
              colorScheme="blue"
              onClick={onCreateOpen}
            >
              New Notification
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Notification Statistics */}
      {stats && (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Sent</StatLabel>
                <StatNumber>{stats.total_sent || 0}</StatNumber>
                <StatHelpText>
                  Last 30 days
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Open Rate</StatLabel>
                <StatNumber color="blue.600">{stats.open_rate || 0}%</StatNumber>
                <StatHelpText>
                  <StatArrow type={stats.open_rate_change > 0 ? 'increase' : 'decrease'} />
                  {Math.abs(stats.open_rate_change || 0)}%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Delivery Rate</StatLabel>
                <StatNumber color="green.600">{stats.delivery_rate || 0}%</StatNumber>
                <StatHelpText>
                  Successful deliveries
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Scheduled</StatLabel>
                <StatNumber color="yellow.600">{stats.scheduled_count || 0}</StatNumber>
                <StatHelpText>
                  Pending delivery
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <FormControl>
              <FormLabel fontSize="sm">Search Notifications</FormLabel>
              <InputGroup size="sm">
                <InputLeftAddon>
                  <SearchIcon />
                </InputLeftAddon>
                <Input
                  placeholder="Search by title or message"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </InputGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Notification Type</FormLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Types</option>
                <option value="push">Push Notification</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="in_app">In-App</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Status</FormLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="sm"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="failed">Failed</option>
                <option value="draft">Draft</option>
                <option value="processing">Processing</option>
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel fontSize="sm">Audience</FormLabel>
              <Select
                size="sm"
                onChange={(e) => {
                  // Implement audience filter
                }}
              >
                <option value="all">All Audiences</option>
                <option value="all_users">All Users</option>
                <option value="drivers">Drivers Only</option>
                <option value="passengers">Passengers Only</option>
              </Select>
            </FormControl>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>All Notifications ({notifications.length})</Tab>
          <Tab>Sent ({notifications.filter(n => n.status === 'sent').length})</Tab>
          <Tab>Scheduled ({notifications.filter(n => n.status === 'scheduled').length})</Tab>
          <Tab>Failed ({notifications.filter(n => n.status === 'failed').length})</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredNotifications}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredNotifications.filter(n => n.status === 'sent')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredNotifications.filter(n => n.status === 'scheduled')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
          
          <TabPanel px={0}>
            <DataTable
              columns={columns}
              data={filteredNotifications.filter(n => n.status === 'failed')}
              loading={loading}
              searchable={false}
              sortable
              pagination
              itemsPerPage={10}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Create Notification Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send New Notification</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Notification Title</FormLabel>
                <Input
                  value={createForm.title}
                  onChange={(e) => handleCreateChange('title', e.target.value)}
                  placeholder="Enter notification title"
                  maxLength={100}
                />
                <Text fontSize="xs" color="gray.500" textAlign="right">
                  {createForm.title.length}/100 characters
                </Text>
              </FormControl>
              
              <FormControl>
                <FormLabel>Message Content</FormLabel>
                <Textarea
                  value={createForm.message}
                  onChange={(e) => handleCreateChange('message', e.target.value)}
                  placeholder="Enter notification message"
                  rows={4}
                  maxLength={500}
                />
                <Text fontSize="xs" color="gray.500" textAlign="right">
                  {createForm.message.length}/500 characters
                </Text>
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Notification Type</FormLabel>
                  <Select
                    value={createForm.notification_type}
                    onChange={(e) => handleCreateChange('notification_type', e.target.value)}
                  >
                    <option value="push">Push Notification</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="in_app">In-App Message</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    value={createForm.priority}
                    onChange={(e) => handleCreateChange('priority', e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Target Audience</FormLabel>
                <Select
                  value={createForm.audience_type}
                  onChange={(e) => handleCreateChange('audience_type', e.target.value)}
                >
                  <option value="all_users">All Users</option>
                  <option value="drivers">Drivers Only</option>
                  <option value="passengers">Passengers Only</option>
                  <option value="specific_users">Specific Users</option>
                  <option value="segment">User Segment</option>
                </Select>
              </FormControl>
              
              {createForm.audience_type === 'specific_users' && (
                <FormControl>
                  <FormLabel>User IDs or Emails</FormLabel>
                  <Input
                    placeholder="Enter user IDs or emails separated by commas"
                    onChange={(e) => handleCreateChange('specific_users', e.target.value.split(',').map(u => u.trim()))}
                  />
                  <Text fontSize="xs" color="gray.500">
                    Separate multiple users with commas
                  </Text>
                </FormControl>
              )}
              
              <FormControl>
                <FormLabel>Delivery Channels</FormLabel>
                <CheckboxGroup
                  value={createForm.channels}
                  onChange={(value) => handleCreateChange('channels', value)}
                >
                  <Stack direction="row" spacing={4}>
                    <Checkbox value="push">Push</Checkbox>
                    <Checkbox value="email">Email</Checkbox>
                    <Checkbox value="sms">SMS</Checkbox>
                    <Checkbox value="in_app">In-App</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>
              
              <FormControl>
                <FormLabel>Delivery Schedule</FormLabel>
                <RadioGroup
                  value={createForm.send_immediately ? 'immediate' : 'scheduled'}
                  onChange={(value) => handleCreateChange('send_immediately', value === 'immediate')}
                >
                  <Stack direction="row" spacing={4}>
                    <Radio value="immediate">Send Immediately</Radio>
                    <Radio value="scheduled">Schedule for Later</Radio>
                  </Stack>
                </RadioGroup>
              </FormControl>
              
              {!createForm.send_immediately && (
                <FormControl>
                  <FormLabel>Scheduled Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={createForm.scheduled_time}
                    onChange={(e) => handleCreateChange('scheduled_time', e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </FormControl>
              )}
              
              {/* Preview Card */}
              <Card width="100%" variant="outline" borderColor="blue.200">
                <CardHeader pb={2}>
                  <Heading size="sm">Notification Preview</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={2}>
                    <Text fontWeight="bold">{createForm.title || 'Notification Title'}</Text>
                    <Text fontSize="sm">{createForm.message || 'Notification message will appear here...'}</Text>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontSize="xs" color="gray.500">
                        Type: {createForm.notification_type} • Audience: {getAudienceLabel(createForm.audience_type)}
                      </Text>
                      <Button
                        size="xs"
                        onClick={handlePreviewNotification}
                        isDisabled={!createForm.title || !createForm.message}
                      >
                        Preview Full
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
              
              {/* Templates */}
              <Accordion allowToggle width="100%">
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Text fontSize="sm">Use Template</Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    <Wrap spacing={2}>
                      <WrapItem>
                        <Button
                          size="xs"
                          onClick={() => {
                            setCreateForm({
                              ...createForm,
                              title: 'Service Update',
                              message: 'We have updated our terms of service. Please review the changes at your convenience.',
                            });
                          }}
                        >
                          Service Update
                        </Button>
                      </WrapItem>
                      <WrapItem>
                        <Button
                          size="xs"
                          onClick={() => {
                            setCreateForm({
                              ...createForm,
                              title: 'Promotion Alert',
                              message: 'Get 20% off your next ride! Use code RIDE20 at checkout. Valid until end of month.',
                            });
                          }}
                        >
                          Promotion
                        </Button>
                      </WrapItem>
                      <WrapItem>
                        <Button
                          size="xs"
                          onClick={() => {
                            setCreateForm({
                              ...createForm,
                              title: 'Safety Reminder',
                              message: 'Remember to wear your mask and maintain social distancing during your rides.',
                            });
                          }}
                        >
                          Safety Reminder
                        </Button>
                      </WrapItem>
                      <WrapItem>
                        <Button
                          size="xs"
                          onClick={() => {
                            setCreateForm({
                              ...createForm,
                              title: 'System Maintenance',
                              message: 'The app will be undergoing maintenance from 2-4 AM tonight. Some features may be temporarily unavailable.',
                            });
                          }}
                        >
                          Maintenance
                        </Button>
                      </WrapItem>
                    </Wrap>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSendNotification}
              isLoading={actionLoading}
              leftIcon={<FaPaperPlane />}
              isDisabled={!createForm.title || !createForm.message}
            >
              Send Notification
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Notification Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Title</Text>
                    <Text fontWeight="bold">{createForm.title}</Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="gray.600">Message</Text>
                    <Text whiteSpace="pre-wrap">{createForm.message}</Text>
                  </Box>
                  
                  <Divider />
                  
                  <SimpleGrid columns={2} spacing={3}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Type</Text>
                      <Text textTransform="capitalize">{createForm.notification_type}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Audience</Text>
                      <Text>{getAudienceLabel(createForm.audience_type)}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Channels</Text>
                      <Text>{createForm.channels.join(', ')}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Priority</Text>
                      <Badge colorScheme={
                        createForm.priority === 'urgent' ? 'red' :
                        createForm.priority === 'high' ? 'orange' :
                        createForm.priority === 'normal' ? 'blue' : 'gray'
                      }>
                        {createForm.priority}
                      </Badge>
                    </Box>
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onPreviewClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack>
                <BellIcon />
                <Text>Notification Details</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                {/* Basic Info */}
                <Card variant="outline">
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                      <Text fontWeight="bold" fontSize="lg">{selectedNotification.title}</Text>
                      <Text whiteSpace="pre-wrap">{selectedNotification.message}</Text>
                      
                      <Divider />
                      
                      <SimpleGrid columns={2} spacing={3}>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Type</Text>
                          <HStack>
                            {getTypeIcon(selectedNotification.type)}
                            <Text textTransform="capitalize">{selectedNotification.type}</Text>
                          </HStack>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Status</Text>
                          <Badge colorScheme={getStatusColor(selectedNotification.status)}>
                            {selectedNotification.status}
                          </Badge>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Audience</Text>
                          <Text>{getAudienceLabel(selectedNotification.audience)}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Priority</Text>
                          <Badge colorScheme={
                            selectedNotification.priority === 'urgent' ? 'red' :
                            selectedNotification.priority === 'high' ? 'orange' :
                            selectedNotification.priority === 'normal' ? 'blue' : 'gray'
                          }>
                            {selectedNotification.priority || 'normal'}
                          </Badge>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader pb={2}>
                    <Heading size="sm">Timeline</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Created</Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(selectedNotification.created_at).toLocaleString()}
                        </Text>
                      </HStack>
                      {selectedNotification.scheduled_at && (
                        <HStack justify="space-between">
                          <Text fontSize="sm">Scheduled For</Text>
                          <Text fontSize="sm" color="gray.500">
                            {new Date(selectedNotification.scheduled_at).toLocaleString()}
                          </Text>
                        </HStack>
                      )}
                      {selectedNotification.sent_at && (
                        <HStack justify="space-between">
                          <Text fontSize="sm">Sent At</Text>
                          <Text fontSize="sm" color="gray.500">
                            {new Date(selectedNotification.sent_at).toLocaleString()}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Delivery Statistics */}
                {selectedNotification.stats && (
                  <Card>
                    <CardHeader pb={2}>
                      <Heading size="sm">Delivery Statistics</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Targeted Users</Text>
                          <Text fontSize="lg" fontWeight="bold">
                            {selectedNotification.target_count || 0}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Successfully Delivered</Text>
                          <Text fontSize="lg" fontWeight="bold" color="green.600">
                            {selectedNotification.delivered_count || 0}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Opened/Read</Text>
                          <Text fontSize="lg" fontWeight="bold" color="blue.600">
                            {selectedNotification.opened_count || 0}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.600">Failed</Text>
                          <Text fontSize="lg" fontWeight="bold" color="red.600">
                            {selectedNotification.failed_count || 0}
                          </Text>
                        </Box>
                      </SimpleGrid>
                      
                      {selectedNotification.target_count > 0 && (
                        <Box mt={4}>
                          <Text fontSize="sm" color="gray.600">Delivery Rate</Text>
                          <Progress 
                            value={(selectedNotification.delivered_count / selectedNotification.target_count) * 100} 
                            colorScheme="green" 
                            size="sm"
                            mt={1}
                          />
                          <Text fontSize="xs" color="gray.500" textAlign="right" mt={1}>
                            {((selectedNotification.delivered_count / selectedNotification.target_count) * 100).toFixed(1)}%
                          </Text>
                        </Box>
                      )}
                    </CardBody>
                  </Card>
                )}

                {/* Error Details */}
                {selectedNotification.status === 'failed' && selectedNotification.error_details && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Delivery Failed</AlertTitle>
                      <AlertDescription>
                        {selectedNotification.error_details}
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onDetailClose}>
                Close
              </Button>
              {selectedNotification.status === 'sent' && hasPermission('notifications', 'resend') && (
                <Button
                  colorScheme="blue"
                  onClick={() => {
                    onDetailClose();
                    handleResendNotification(selectedNotification);
                  }}
                >
                  Resend
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={() => {
          if (modalConfig.action === 'delete') {
            toast({
              title: 'Notification deleted',
              description: `${selectedNotification?.title} has been deleted`,
              status: 'success',
              duration: 3000,
            });
            fetchNotifications();
          } else if (modalConfig.action === 'resend') {
            toast({
              title: 'Notification resent',
              description: `${selectedNotification?.title} has been resent`,
              status: 'success',
              duration: 3000,
            });
            fetchNotifications();
          }
          onClose();
          setSelectedNotification(null);
        }}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        isLoading={actionLoading}
      />
    </Box>
  );
};

export default Notifications;