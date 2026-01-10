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
  StatArrow, // ADD THIS - Missing import
  StatGroup,
  Radio,
  RadioGroup,
  IconButton, // ADD THIS - Also missing
} from '@chakra-ui/react';
import { 
  FaBell, 
  FaEnvelope, 
  FaSms, 
  FaMobileAlt, 
  FaCog,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHistory,
  FaFilter,
  FaSortAmountDown,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaChartLine,
  FaRobot,
  FaUserCheck,
  FaUserTimes,
  FaMoneyBillWave,
  FaRoute,
  FaCar,
  FaExclamationCircle,
  FaPlay,
  FaStop,
  FaPause,
  FaUndo,
  FaDatabase,
  FaServer,
  FaPaperPlane,
  FaVolumeUp,
  FaVolumeMute,
  FaSave, // ADD THIS - You're using it at line 1386
} from 'react-icons/fa';
import PageContainer from '../../components/PageContainer';
import SettingsMenu from '../../components/SettingsMenu';
import { supabase } from '../../services/supabase';

const Notifications = () => {
  const toast = useToast();
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    push_enabled: true,
    email_enabled: false,
    sms_enabled: false,
    push_sound: true,
    push_vibration: true,
    email_daily_summary: true,
    email_weekly_report: false,
    sms_emergency_only: true,
    notification_cooldown: 5,
    max_notifications_per_day: 20,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '06:00',
  });
  
  // Automation rules state
  const [automationRules, setAutomationRules] = useState([]);
  const [notificationsHistory, setNotificationsHistory] = useState([]);
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  
  // Loading and saving states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // New automation rule
  const [newRule, setNewRule] = useState({
    name: '',
    event_type: 'driver_low_rating',
    condition_value: 3.5,
    action_type: 'send_notification',
    notification_type: 'push',
    recipient_type: 'admin',
    is_active: true,
    cooldown_minutes: 60,
  });
  
  // Test notification
  const [testNotification, setTestNotification] = useState({
    type: 'push',
    recipient: 'admin',
    title: 'Test Notification',
    message: 'This is a test notification from the admin panel.',
    data: {},
  });
  
  // Modals
  const { isOpen: isRuleModalOpen, onOpen: onRuleModalOpen, onClose: onRuleModalClose } = useDisclosure();
  const { isOpen: isTestModalOpen, onOpen: onTestModalOpen, onClose: onTestModalClose } = useDisclosure();
  const { isOpen: isHistoryModalOpen, onOpen: onHistoryModalOpen, onClose: onHistoryModalClose } = useDisclosure();
  const { isOpen: isTemplateModalOpen, onOpen: onTemplateModalOpen, onClose: onTemplateModalClose } = useDisclosure();
  
  // Event types for automation
  const eventTypes = [
    { id: 'driver_low_rating', label: 'Driver Low Rating', icon: FaUserTimes, description: 'Driver rating falls below threshold' },
    { id: 'driver_approved', label: 'Driver Approved', icon: FaUserCheck, description: 'Driver application approved' },
    { id: 'driver_suspended', label: 'Driver Suspended', icon: FaUserTimes, description: 'Driver account suspended' },
    { id: 'ride_cancelled', label: 'Ride Cancelled', icon: FaRoute, description: 'Passenger cancels ride' },
    { id: 'payment_failed', label: 'Payment Failed', icon: FaMoneyBillWave, description: 'Payment processing failed' },
    { id: 'high_demand', label: 'High Demand', icon: FaCar, description: 'High passenger demand in area' },
    { id: 'low_supply', label: 'Low Driver Supply', icon: FaExclamationCircle, description: 'Low driver availability' },
    { id: 'suspicious_activity', label: 'Suspicious Activity', icon: FaExclamationTriangle, description: 'Suspicious activity detected' },
  ];
  
  // Notification templates
  const defaultTemplates = [
    {
      id: 'driver_approved',
      name: 'Driver Approved',
      title: 'Congratulations! Your driver account is approved',
      message: 'Dear {driver_name}, your driver account has been approved. You can now go online and start accepting rides.',
      variables: ['driver_name'],
    },
    {
      id: 'driver_suspended',
      name: 'Driver Suspended',
      title: 'Account Suspension Notice',
      message: 'Dear {driver_name}, your account has been suspended due to {reason}. Contact support for more information.',
      variables: ['driver_name', 'reason'],
    },
    {
      id: 'ride_cancelled',
      name: 'Ride Cancelled',
      title: 'Ride Cancelled',
      message: 'Your ride from {pickup} to {dropoff} has been cancelled. {refund_amount} has been refunded to your account.',
      variables: ['pickup', 'dropoff', 'refund_amount'],
    },
    {
      id: 'payment_failed',
      name: 'Payment Failed',
      title: 'Payment Processing Failed',
      message: 'Payment for ride #{ride_id} failed. Please update your payment method or contact support.',
      variables: ['ride_id'],
    },
    {
      id: 'low_rating_alert',
      name: 'Low Rating Alert',
      title: 'Low Rating Alert',
      message: 'Driver {driver_name} has a rating of {rating}. Consider reviewing their performance.',
      variables: ['driver_name', 'rating'],
    },
  ];
  
  // Fetch notification settings
  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      
      const [settingsResult, rulesResult] = await Promise.all([
        supabase.from('notification_settings').select('*').single(),
        supabase.from('automation_rules').select('*').order('created_at', { ascending: false }),
      ]);
      
      if (settingsResult.error && settingsResult.error.code !== 'PGRST116') throw settingsResult.error;
      
      if (settingsResult.data) {
        setNotificationSettings(settingsResult.data);
      }
      
      if (rulesResult.data) {
        setAutomationRules(rulesResult.data);
      }
      
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notification settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch notifications history
  const fetchNotificationsHistory = async () => {
    try {
      setHistoryLoading(true);
      
      const { data, error } = await supabase
        .from('notifications_history')
        .select(`
          *,
          sender:sender_id (
            email,
            full_name
          ),
          recipient:recipient_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      if (data) {
        setNotificationsHistory(data);
      }
    } catch (error) {
      console.error('Error fetching notifications history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  // Save notification settings
  const saveNotificationSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          ...notificationSettings,
          updated_at: new Date().toISOString(),
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Notification settings saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Create automation rule
  const createAutomationRule = async () => {
    if (!newRule.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a rule name',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('automation_rules')
        .insert({
          name: newRule.name.trim(),
          event_type: newRule.event_type,
          condition_value: newRule.condition_value,
          action_type: newRule.action_type,
          notification_type: newRule.notification_type,
          recipient_type: newRule.recipient_type,
          is_active: newRule.is_active,
          cooldown_minutes: newRule.cooldown_minutes,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Automation rule created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setNewRule({
        name: '',
        event_type: 'driver_low_rating',
        condition_value: 3.5,
        action_type: 'send_notification',
        notification_type: 'push',
        recipient_type: 'admin',
        is_active: true,
        cooldown_minutes: 60,
      });
      
      onRuleModalClose();
      fetchNotificationSettings();
      
    } catch (error) {
      console.error('Error creating automation rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create automation rule',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Toggle automation rule
  const toggleAutomationRule = async (ruleId, isActive) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .update({
          is_active: !isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ruleId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Automation rule ${!isActive ? 'activated' : 'deactivated'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchNotificationSettings();
      
    } catch (error) {
      console.error('Error toggling automation rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to update automation rule',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Delete automation rule
  const deleteAutomationRule = async (ruleId) => {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', ruleId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Automation rule deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchNotificationSettings();
      
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete automation rule',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Send test notification
  const sendTestNotification = async () => {
    try {
      setSendingTest(true);
      
      const user = await supabase.auth.getUser();
      const adminId = user.data.user?.id;
      
      // Insert test notification into history
      const { error } = await supabase
        .from('notifications_history')
        .insert({
          sender_id: adminId,
          recipient_type: testNotification.recipient,
          notification_type: testNotification.type,
          title: testNotification.title,
          message: testNotification.message,
          data: testNotification.data,
          status: 'sent',
          is_test: true,
        });
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Test notification sent successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // In production, you would trigger actual push/email/SMS here
      console.log('Test notification:', testNotification);
      
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSendingTest(false);
    }
  };
  
  // Reset to default templates
  const resetToDefaultTemplates = async () => {
    try {
      // This would save templates to database in production
      setNotificationTemplates(defaultTemplates);
      
      toast({
        title: 'Templates Reset',
        description: 'Notification templates reset to defaults',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error resetting templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset templates',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Handle setting change
  const handleSettingChange = (key, value) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle automation rule change
  const handleRuleChange = (key, value) => {
    setNewRule(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle test notification change
  const handleTestNotificationChange = (key, value) => {
    setTestNotification(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Get event type details
  const getEventTypeDetails = (eventType) => {
    return eventTypes.find(e => e.id === eventType) || eventTypes[0];
  };
  
  // Refresh all data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotificationSettings();
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  // Load data on component mount
  useEffect(() => {
    fetchNotificationSettings();
    setNotificationTemplates(defaultTemplates);
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('notification_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'notification_settings' }, 
        fetchNotificationSettings
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'automation_rules' }, 
        fetchNotificationSettings
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  if (loading) {
    return (
      <PageContainer title="Notifications & Automation" subtitle="Configure notifications and automation rules">
        <Flex gap={6}>
          <SettingsMenu />
          <Box flex={1} display="flex" alignItems="center" justifyContent="center" minH="400px">
            <Text>Loading notification settings...</Text>
          </Box>
        </Flex>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer 
      title="Notifications & Automation" 
      subtitle="Configure notifications, automation rules, and notification templates"
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
                    Notification System
                  </Heading>
                  <Text color="gray.600" fontSize="sm">
                    {automationRules.filter(r => r.is_active).length} active automation rules
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
                    leftIcon={<FaPaperPlane />}
                    colorScheme="brand"
                    size="sm"
                    onClick={onTestModalOpen}
                  >
                    Send Test
                  </Button>
                </HStack>
              </Flex>
            </CardBody>
          </Card>
          
          <Tabs colorScheme="brand">
            <TabList>
              <Tab fontWeight="semibold">
                <Icon as={FaBell} mr={2} />
                Notification Settings
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaRobot} mr={2} />
                Automation Rules
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaDatabase} mr={2} />
                Notification Templates
              </Tab>
              <Tab fontWeight="semibold">
                <Icon as={FaHistory} mr={2} />
                Notification History
              </Tab>
            </TabList>
            
            <TabPanels>
              {/* Tab 1: Notification Settings */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Notification Channels</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <HStack>
                              <Icon as={FaMobileAlt} color="blue.500" />
                              <FormLabel mb={1} fontWeight="medium">
                                Push Notifications
                              </FormLabel>
                            </HStack>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Send notifications to mobile apps
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={notificationSettings.push_enabled}
                            onChange={(e) => handleSettingChange('push_enabled', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        {notificationSettings.push_enabled && (
                          <VStack spacing={4} pl={6} align="stretch">
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <FormLabel mb={1} fontWeight="medium">
                                  Push Sound
                                </FormLabel>
                                <FormHelperText fontSize="sm" color="gray.600">
                                  Play sound for push notifications
                                </FormHelperText>
                              </Box>
                              <Switch
                                colorScheme="brand"
                                isChecked={notificationSettings.push_sound}
                                onChange={(e) => handleSettingChange('push_sound', e.target.checked)}
                                size="md"
                              />
                            </FormControl>
                            
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <FormLabel mb={1} fontWeight="medium">
                                  Push Vibration
                                </FormLabel>
                                <FormHelperText fontSize="sm" color="gray.600">
                                  Vibrate for push notifications
                                </FormHelperText>
                              </Box>
                              <Switch
                                colorScheme="brand"
                                isChecked={notificationSettings.push_vibration}
                                onChange={(e) => handleSettingChange('push_vibration', e.target.checked)}
                                size="md"
                              />
                            </FormControl>
                          </VStack>
                        )}
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <HStack>
                              <Icon as={FaEnvelope} color="red.500" />
                              <FormLabel mb={1} fontWeight="medium">
                                Email Notifications
                              </FormLabel>
                            </HStack>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Send notifications via email
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={notificationSettings.email_enabled}
                            onChange={(e) => handleSettingChange('email_enabled', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        {notificationSettings.email_enabled && (
                          <VStack spacing={4} pl={6} align="stretch">
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <FormLabel mb={1} fontWeight="medium">
                                  Daily Summary Email
                                </FormLabel>
                                <FormHelperText fontSize="sm" color="gray.600">
                                  Send daily summary to admins
                                </FormHelperText>
                              </Box>
                              <Switch
                                colorScheme="brand"
                                isChecked={notificationSettings.email_daily_summary}
                                onChange={(e) => handleSettingChange('email_daily_summary', e.target.checked)}
                                size="md"
                              />
                            </FormControl>
                            
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <Box>
                                <FormLabel mb={1} fontWeight="medium">
                                  Weekly Report Email
                                </FormLabel>
                                <FormHelperText fontSize="sm" color="gray.600">
                                  Send weekly performance report
                                </FormHelperText>
                              </Box>
                              <Switch
                                colorScheme="brand"
                                isChecked={notificationSettings.email_weekly_report}
                                onChange={(e) => handleSettingChange('email_weekly_report', e.target.checked)}
                                size="md"
                              />
                            </FormControl>
                          </VStack>
                        )}
                        
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <HStack>
                              <Icon as={FaSms} color="green.500" />
                              <FormLabel mb={1} fontWeight="medium">
                                SMS Notifications
                              </FormLabel>
                            </HStack>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Send notifications via SMS
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={notificationSettings.sms_enabled}
                            onChange={(e) => handleSettingChange('sms_enabled', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        {notificationSettings.sms_enabled && (
                          <FormControl display="flex" alignItems="center" justifyContent="space-between" pl={6}>
                            <Box>
                              <FormLabel mb={1} fontWeight="medium">
                                Emergency SMS Only
                              </FormLabel>
                              <FormHelperText fontSize="sm" color="gray.600">
                                Send SMS only for critical alerts
                              </FormHelperText>
                            </Box>
                            <Switch
                              colorScheme="brand"
                              isChecked={notificationSettings.sms_emergency_only}
                              onChange={(e) => handleSettingChange('sms_emergency_only', e.target.checked)}
                              size="md"
                            />
                          </FormControl>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Notification Limits</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Notification Cooldown (minutes)
                          </FormLabel>
                          <NumberInput
                            value={notificationSettings.notification_cooldown}
                            onChange={(value) => handleSettingChange('notification_cooldown', parseInt(value) || 5)}
                            min={1}
                            max={60}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Minimum time between same-type notifications
                          </FormHelperText>
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel fontWeight="medium">
                            Max Notifications Per Day
                          </FormLabel>
                          <NumberInput
                            value={notificationSettings.max_notifications_per_day}
                            onChange={(value) => handleSettingChange('max_notifications_per_day', parseInt(value) || 20)}
                            min={1}
                            max={100}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <FormHelperText>
                            Maximum notifications sent to a single user per day
                          </FormHelperText>
                        </FormControl>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="md">Quiet Hours</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={6} align="stretch">
                        <FormControl display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <FormLabel mb={1} fontWeight="medium">
                              Enable Quiet Hours
                            </FormLabel>
                            <FormHelperText fontSize="sm" color="gray.600">
                              Suppress non-urgent notifications during quiet hours
                            </FormHelperText>
                          </Box>
                          <Switch
                            colorScheme="brand"
                            isChecked={notificationSettings.quiet_hours_enabled}
                            onChange={(e) => handleSettingChange('quiet_hours_enabled', e.target.checked)}
                            size="lg"
                          />
                        </FormControl>
                        
                        {notificationSettings.quiet_hours_enabled && (
                          <HStack spacing={6}>
                            <FormControl flex={1}>
                              <FormLabel fontWeight="medium">Start Time</FormLabel>
                              <Input
                                type="time"
                                value={notificationSettings.quiet_hours_start}
                                onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                              />
                            </FormControl>
                            
                            <FormControl flex={1}>
                              <FormLabel fontWeight="medium">End Time</FormLabel>
                              <Input
                                type="time"
                                value={notificationSettings.quiet_hours_end}
                                onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                              />
                            </FormControl>
                          </HStack>
                        )}
                        
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Emergency Notifications</AlertTitle>
                            <AlertDescription>
                              Critical alerts are sent regardless of quiet hours settings.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      </VStack>
                    </CardBody>
                    <CardFooter pt={3}>
                      <Button
                        colorScheme="brand"
                        size="lg"
                        width="full"
                        isLoading={saving}
                        onClick={saveNotificationSettings}
                        leftIcon={<FaSave />}
                      >
                        Save Notification Settings
                      </Button>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 2: Automation Rules */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Automation Rules</Heading>
                        <Button
                          leftIcon={<FaPlus />}
                          colorScheme="brand"
                          size="sm"
                          onClick={onRuleModalOpen}
                        >
                          Create Rule
                        </Button>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {automationRules.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No automation rules</AlertTitle>
                            <AlertDescription>
                              Create rules to automatically send notifications based on events.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Rule Name</Th>
                              <Th>Event</Th>
                              <Th>Condition</Th>
                              <Th>Action</Th>
                              <Th>Status</Th>
                              <Th>Actions</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {automationRules.map((rule) => {
                              const eventType = getEventTypeDetails(rule.event_type);
                              return (
                                <Tr key={rule.id} _hover={{ bg: 'gray.50' }}>
                                  <Td>
                                    <Text fontWeight="medium" fontSize="sm">
                                      {rule.name}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <HStack>
                                      <Icon as={eventType.icon} color="brand.500" boxSize="12px" />
                                      <Text fontSize="sm">{eventType.label}</Text>
                                    </HStack>
                                  </Td>
                                  <Td>
                                    <Badge colorScheme="blue" fontSize="xs">
                                      {rule.event_type === 'driver_low_rating' && `Rating < ${rule.condition_value}`}
                                      {rule.event_type === 'driver_approved' && 'Driver Approved'}
                                      {rule.event_type === 'driver_suspended' && 'Driver Suspended'}
                                      {rule.event_type === 'ride_cancelled' && 'Ride Cancelled'}
                                      {rule.event_type === 'payment_failed' && 'Payment Failed'}
                                      {rule.event_type === 'high_demand' && 'High Demand'}
                                      {rule.event_type === 'low_supply' && 'Low Supply'}
                                      {rule.event_type === 'suspicious_activity' && 'Suspicious Activity'}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <HStack>
                                      <Badge
                                        colorScheme={
                                          rule.notification_type === 'push' ? 'blue' :
                                          rule.notification_type === 'email' ? 'red' : 'green'
                                        }
                                        fontSize="xs"
                                      >
                                        {rule.notification_type}
                                      </Badge>
                                      <Text fontSize="xs" color="gray.600">
                                        to {rule.recipient_type}
                                      </Text>
                                    </HStack>
                                  </Td>
                                  <Td>
                                    <Switch
                                      colorScheme="brand"
                                      isChecked={rule.is_active}
                                      onChange={() => toggleAutomationRule(rule.id, rule.is_active)}
                                      size="sm"
                                    />
                                  </Td>
                                  <Td>
                                    <IconButton
                                      icon={<FaTrash />}
                                      colorScheme="red"
                                      variant="ghost"
                                      size="sm"
                                      aria-label="Delete Rule"
                                      onClick={() => deleteAutomationRule(rule.id)}
                                    />
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="sm">Common Automation Scenarios</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack p={3} bg="gray.50" borderRadius="md">
                          <Icon as={FaUserTimes} color="red.500" />
                          <Box flex={1}>
                            <Text fontSize="sm" fontWeight="medium">Driver Performance Alert</Text>
                            <Text fontSize="xs" color="gray.600">
                              Auto-suspend driver when rating falls below 3.0
                            </Text>
                          </Box>
                          <Badge colorScheme="red">Critical</Badge>
                        </HStack>
                        
                        <HStack p={3} bg="gray.50" borderRadius="md">
                          <Icon as={FaMoneyBillWave} color="orange.500" />
                          <Box flex={1}>
                            <Text fontSize="sm" fontWeight="medium">Payment Failure Alert</Text>
                            <Text fontSize="xs" color="gray.600">
                              Notify admin when payment fails 3 times consecutively
                            </Text>
                          </Box>
                          <Badge colorScheme="orange">High</Badge>
                        </HStack>
                        
                        <HStack p={3} bg="gray.50" borderRadius="md">
                          <Icon as={FaCar} color="blue.500" />
                          <Box flex={1}>
                            <Text fontSize="sm" fontWeight="medium">High Demand Notification</Text>
                            <Text fontSize="xs" color="gray.600">
                              Notify drivers when passenger demand exceeds supply
                            </Text>
                          </Box>
                          <Badge colorScheme="blue">Medium</Badge>
                        </HStack>
                        
                        <HStack p={3} bg="gray.50" borderRadius="md">
                          <Icon as={FaUserCheck} color="green.500" />
                          <Box flex={1}>
                            <Text fontSize="sm" fontWeight="medium">Driver Welcome</Text>
                            <Text fontSize="xs" color="gray.600">
                              Send welcome notification when driver is approved
                            </Text>
                          </Box>
                          <Badge colorScheme="green">Low</Badge>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 3: Notification Templates */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Notification Templates</Heading>
                        <Button
                          leftIcon={<FaUndo />}
                          colorScheme="gray"
                          variant="outline"
                          size="sm"
                          onClick={resetToDefaultTemplates}
                        >
                          Reset to Defaults
                        </Button>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {notificationTemplates.map((template) => (
                          <Card key={template.id} variant="outline" borderColor="gray.200">
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                <HStack justify="space-between">
                                  <Text fontWeight="bold">{template.name}</Text>
                                  <Badge colorScheme="purple">{template.id}</Badge>
                                </HStack>
                                
                                <Box>
                                  <Text fontSize="sm" fontWeight="medium" color="gray.700">Title:</Text>
                                  <Text fontSize="sm" bg="gray.50" p={2} borderRadius="md">
                                    {template.title}
                                  </Text>
                                </Box>
                                
                                <Box>
                                  <Text fontSize="sm" fontWeight="medium" color="gray.700">Message:</Text>
                                  <Text fontSize="sm" bg="gray.50" p={2} borderRadius="md">
                                    {template.message}
                                  </Text>
                                </Box>
                                
                                {template.variables && template.variables.length > 0 && (
                                  <Box>
                                    <Text fontSize="sm" fontWeight="medium" color="gray.700">Variables:</Text>
                                    <HStack spacing={2} mt={1}>
                                      {template.variables.map((variable) => (
                                        <Badge key={variable} colorScheme="teal" fontSize="xs">
                                          {`{${variable}}`}
                                        </Badge>
                                      ))}
                                    </HStack>
                                  </Box>
                                )}
                              </VStack>
                            </CardBody>
                            <CardFooter pt={0}>
                              <Button
                                size="sm"
                                colorScheme="brand"
                                variant="outline"
                                leftIcon={<FaEdit />}
                                onClick={() => {
                                  // In production, you would open edit modal
                                  toast({
                                    title: 'Edit Template',
                                    description: 'Template editing feature coming soon',
                                    status: 'info',
                                    duration: 3000,
                                  });
                                }}
                              >
                                Edit Template
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </VStack>
                    </CardBody>
                    <CardFooter pt={3}>
                      <Text fontSize="sm" color="gray.600">
                        Templates use variables like {'{driver_name}'} that are replaced with actual values.
                      </Text>
                    </CardFooter>
                  </Card>
                </VStack>
              </TabPanel>
              
              {/* Tab 4: Notification History */}
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Flex justify="space-between" align="center">
                        <Heading size="md">Notification History</Heading>
                        <Button
                          leftIcon={<FaHistory />}
                          colorScheme="gray"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            fetchNotificationsHistory();
                            onHistoryModalOpen();
                          }}
                        >
                          View Full History
                        </Button>
                      </Flex>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      {historyLoading ? (
                        <Box textAlign="center" py={8}>
                          <Text>Loading notification history...</Text>
                        </Box>
                      ) : notificationsHistory.length === 0 ? (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>No notification history</AlertTitle>
                            <AlertDescription>
                              Sent notifications will appear here.
                            </AlertDescription>
                          </Box>
                        </Alert>
                      ) : (
                        <Table variant="simple" size="sm">
                          <Thead>
                            <Tr>
                              <Th>Time</Th>
                              <Th>Type</Th>
                              <Th>Recipient</Th>
                              <Th>Title</Th>
                              <Th>Status</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {notificationsHistory.slice(0, 10).map((notification) => (
                              <Tr key={notification.id} _hover={{ bg: 'gray.50' }}>
                                <Td>
                                  <Text fontSize="xs" color="gray.600">
                                    {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      notification.notification_type === 'push' ? 'blue' :
                                      notification.notification_type === 'email' ? 'red' : 'green'
                                    }
                                    fontSize="xs"
                                  >
                                    {notification.notification_type}
                                  </Badge>
                                  {notification.is_test && (
                                    <Badge colorScheme="yellow" fontSize="xs" ml={1}>
                                      Test
                                    </Badge>
                                  )}
                                </Td>
                                <Td>
                                  <Text fontSize="xs">
                                    {notification.recipient?.email || notification.recipient_type}
                                  </Text>
                                </Td>
                                <Td>
                                  <Text fontSize="xs" maxW="200px" isTruncated>
                                    {notification.title}
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge
                                    colorScheme={
                                      notification.status === 'sent' ? 'green' :
                                      notification.status === 'failed' ? 'red' :
                                      notification.status === 'pending' ? 'yellow' : 'gray'
                                    }
                                    fontSize="xs"
                                  >
                                    {notification.status}
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
                        Showing last 10 notifications. Click "View Full History" to see all.
                      </Text>
                    </CardFooter>
                  </Card>
                  
                  <Card borderColor="gray.200">
                    <CardHeader pb={3}>
                      <Heading size="sm">Notification Statistics</Heading>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                      <StatGroup>
                        <Stat>
                          <StatLabel>Today</StatLabel>
                          <StatNumber>24</StatNumber>
                          <StatHelpText>
                            <StatArrow type="increase" />
                            12%
                          </StatHelpText>
                        </Stat>
                        
                        <Stat>
                          <StatLabel>This Week</StatLabel>
                          <StatNumber>156</StatNumber>
                          <StatHelpText>
                            <StatArrow type="increase" />
                            8%
                          </StatHelpText>
                        </Stat>
                        
                        <Stat>
                          <StatLabel>Success Rate</StatLabel>
                          <StatNumber>98.5%</StatNumber>
                          <StatHelpText>
                            Last 7 days
                          </StatHelpText>
                        </Stat>
                      </StatGroup>
                    </CardBody>
                  </Card>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
      
      {/* Modal for creating automation rule */}
      <Modal isOpen={isRuleModalOpen} onClose={onRuleModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Automation Rule</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Rule Name</FormLabel>
                <Input
                  placeholder="e.g., Low Rating Alert, Payment Failure Notification"
                  value={newRule.name}
                  onChange={(e) => handleRuleChange('name', e.target.value)}
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Event Type</FormLabel>
                <Select
                  value={newRule.event_type}
                  onChange={(e) => {
                    handleRuleChange('event_type', e.target.value);
                    // Set default condition value based on event type
                    if (e.target.value === 'driver_low_rating') {
                      handleRuleChange('condition_value', 3.5);
                    } else if (e.target.value === 'high_demand') {
                      handleRuleChange('condition_value', 10);
                    }
                  }}
                >
                  {eventTypes.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.label} - {event.description}
                    </option>
                  ))}
                </Select>
              </FormControl>
              
              {newRule.event_type === 'driver_low_rating' && (
                <FormControl isRequired>
                  <FormLabel>Rating Threshold (0-5)</FormLabel>
                  <Slider
                    value={newRule.condition_value}
                    onChange={(value) => handleRuleChange('condition_value', value)}
                    min={1}
                    max={5}
                    step={0.1}
                  >
                    <SliderTrack>
                      <SliderFilledTrack bg="brand.500" />
                    </SliderTrack>
                    <SliderThumb boxSize={6}>
                      <Box color="brand.500" as={FaChartLine} />
                    </SliderThumb>
                    <SliderMark value={newRule.condition_value} mt={3} ml={-5} fontSize="sm">
                      {newRule.condition_value}
                    </SliderMark>
                  </Slider>
                  <HStack justify="space-between" mt={2}>
                    <Text fontSize="sm" color="gray.600">1.0</Text>
                    <Text fontSize="sm" color="gray.600">Threshold: {newRule.condition_value}</Text>
                    <Text fontSize="sm" color="gray.600">5.0</Text>
                  </HStack>
                </FormControl>
              )}
              
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel>Notification Type</FormLabel>
                  <Select
                    value={newRule.notification_type}
                    onChange={(e) => handleRuleChange('notification_type', e.target.value)}
                  >
                    <option value="push">Push Notification</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </Select>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel>Recipient</FormLabel>
                  <Select
                    value={newRule.recipient_type}
                    onChange={(e) => handleRuleChange('recipient_type', e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="driver">Driver</option>
                    <option value="passenger">Passenger</option>
                    <option value="all_drivers">All Drivers</option>
                    <option value="all_users">All Users</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Cooldown Period (minutes)</FormLabel>
                <NumberInput
                  value={newRule.cooldown_minutes}
                  onChange={(value) => handleRuleChange('cooldown_minutes', parseInt(value) || 60)}
                  min={1}
                  max={1440}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>
                  Minimum time between triggering same rule
                </FormHelperText>
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <Switch
                  isChecked={newRule.is_active}
                  onChange={(e) => handleRuleChange('is_active', e.target.checked)}
                  colorScheme="brand"
                  mr={3}
                />
                <FormLabel mb={0}>Rule is Active</FormLabel>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRuleModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={createAutomationRule}
            >
              Create Rule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for sending test notification */}
      <Modal isOpen={isTestModalOpen} onClose={onTestModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Test Notification</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <FormControl flex={1}>
                  <FormLabel>Notification Type</FormLabel>
                  <Select
                    value={testNotification.type}
                    onChange={(e) => handleTestNotificationChange('type', e.target.value)}
                  >
                    <option value="push">Push Notification</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </Select>
                </FormControl>
                
                <FormControl flex={1}>
                  <FormLabel>Recipient</FormLabel>
                  <Select
                    value={testNotification.recipient}
                    onChange={(e) => handleTestNotificationChange('recipient', e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="driver">Driver</option>
                    <option value="passenger">Passenger</option>
                  </Select>
                </FormControl>
              </HStack>
              
              <FormControl isRequired>
                <FormLabel>Notification Title</FormLabel>
                <Input
                  value={testNotification.title}
                  onChange={(e) => handleTestNotificationChange('title', e.target.value)}
                  placeholder="Enter notification title"
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Notification Message</FormLabel>
                <Textarea
                  value={testNotification.message}
                  onChange={(e) => handleTestNotificationChange('message', e.target.value)}
                  placeholder="Enter notification message"
                  rows={3}
                />
              </FormControl>
              
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  This will send a test notification to the selected recipient type.
                  In production, this would trigger actual push/email/SMS.
                </AlertDescription>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onTestModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="brand" 
              onClick={sendTestNotification}
              isLoading={sendingTest}
              leftIcon={<FaPaperPlane />}
            >
              Send Test Notification
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for notification history */}
      <Modal isOpen={isHistoryModalOpen} onClose={onHistoryModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Notification History</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {historyLoading ? (
              <Box textAlign="center" py={8}>
                <Text>Loading notification history...</Text>
              </Box>
            ) : notificationsHistory.length === 0 ? (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>No notification history</AlertTitle>
                  <AlertDescription>
                    Sent notifications will appear here.
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Timestamp</Th>
                    <Th>Type</Th>
                    <Th>Sender</Th>
                    <Th>Recipient</Th>
                    <Th>Title</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {notificationsHistory.map((notification) => (
                    <Tr key={notification.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(notification.created_at).toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            notification.notification_type === 'push' ? 'blue' :
                            notification.notification_type === 'email' ? 'red' : 'green'
                          }
                          fontSize="xs"
                        >
                          {notification.notification_type}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {notification.sender?.email || 'System'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {notification.recipient?.email || notification.recipient_type}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" maxW="200px">
                          {notification.title}
                        </Text>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={
                            notification.status === 'sent' ? 'green' :
                            notification.status === 'failed' ? 'red' :
                            notification.status === 'pending' ? 'yellow' : 'gray'
                          }
                          fontSize="xs"
                        >
                          {notification.status}
                        </Badge>
                        {notification.is_test && (
                          <Badge colorScheme="yellow" fontSize="xs" ml={1}>
                            Test
                          </Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onHistoryModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal for template management */}
      <Modal isOpen={isTemplateModalOpen} onClose={onTemplateModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Manage Notification Templates</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Template management interface would go here.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onTemplateModalClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default Notifications;